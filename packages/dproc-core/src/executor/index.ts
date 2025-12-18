import { Queue } from "bullmq";
import { pathToFileURL } from "url";
import { MetadataDB } from "../db/sqlite.js";
import { LLMProvider } from "../llm/provider.js";
import { TemplateRenderer } from "../template/renderer.js";
import { ConfigLoader } from "../config/index.js";
import { CacheManager } from "../cache/index.js";
import * as fs from "fs/promises";
import * as path from "path";
import type {
  JobData,
  ProcessorContext,
  ProcessorResult,
  LLMEnrichmentResult,
  TemplateContext,
  PipelineSpec,
  LLMConfig,
} from "@dproc/types";

export class ReportExecutor {
  private queue: Queue;
  private db: MetadataDB;
  private llmProvider: LLMProvider;
  private templateRenderer: TemplateRenderer;
  private configLoader: ConfigLoader;
  private cacheStore: CacheManager;

  constructor(
    private pipelinesDir: string,
    redisConfig: any
  ) {
    this.queue = new Queue("dproc-jobs", { connection: redisConfig });
    this.db = new MetadataDB("./dproc.db");
    this.llmProvider = new LLMProvider();
    this.templateRenderer = new TemplateRenderer();
    this.configLoader = new ConfigLoader();
    this.cacheStore = new CacheManager();
  }

  /**
   * Add job to queue for async processing
   */
  async enqueueJob(jobData: JobData): Promise<string> {
    const job = await this.queue.add("process-pipeline", jobData, {
      priority:
        jobData.priority === "high" ? 1 : jobData.priority === "low" ? 10 : 5,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    });

    // Save to database
    await this.db.insertExecution({
      id: `exec-${Date.now()}`,
      jobId: job.id!,
      pipelineName: jobData.pipelineName,
      userId: jobData.userId,
      inputs: jobData.inputs,
      outputFormat: jobData.outputFormat,
      status: "queued",
      priority: jobData.priority,
      createdAt: Date.now(),
    });

    return job.id!;
  }

  /**
   * Main execution flow - called by worker
   */
  async execute(jobData: JobData): Promise<void> {
    const startTime = Date.now();

    // Find existing execution record by jobId (created by web UI or CLI)
    const executions = this.db.listExecutions({ limit: 1000 });
    const existingExecution = executions.find((e) => e.jobId === jobData.jobId);

    // Use existing execution ID or create new one (for CLI)
    const executionId = existingExecution
      ? existingExecution.id
      : `exec-${Date.now()}-${jobData.jobId}`;

    const logger = {
      info: (msg: string) => console.log(`[${executionId}] INFO: ${msg}`),
      error: (msg: string) => console.error(`[${executionId}] ERROR: ${msg}`),
      debug: (msg: string) => console.log(`[${executionId}] DEBUG: ${msg}`),
      warn: (msg: string) => console.warn(`[${executionId}] WARN: ${msg}`),
    };

    try {
      // Only create if doesn't exist (CLI case)
      if (!existingExecution) {
        await this.db.insertExecution({
          id: executionId,
          jobId: jobData.jobId,
          pipelineName: jobData.pipelineName,
          userId: jobData.userId,
          inputs: jobData.inputs,
          outputFormat: jobData.outputFormat,
          status: "processing",
          priority: jobData.priority,
          createdAt: jobData.createdAt,
          startedAt: Date.now(),
        });
      } else {
        // Update existing record to processing (Web UI case)
        await this.db.updateStatus(executionId, "processing", {
          startedAt: Date.now(),
        });
      }

      // ========================================================================
      // STEP 1: Load pipeline configuration
      // ========================================================================
      console.log(`[${executionId}] Loading pipeline configuration...`);
      const pipelinePath = path.join(this.pipelinesDir, jobData.pipelineName);
      const spec = await this.configLoader.loadPipelineSpec(pipelinePath);
      const config = await this.configLoader.loadPipelineConfig(pipelinePath);
      const vars = spec.variables ?? {};

      // ========================================================================
      // STEP 2: Execute data processor
      // ========================================================================
      console.log(`[${executionId}] Executing data processor...`);
      const processorResult = await this.executeProcessor(
        pipelinePath,
        jobData.inputs,
        executionId
      );

      // Save bundle
      const bundlePath = await this.saveBundle(
        pipelinePath,
        processorResult.attributes,
        executionId
      );
      console.log(`[${executionId}] Bundle saved: ${bundlePath}`);

      // ========================================================================
      // STEP 3: Load and render prompt templates
      // ========================================================================
      console.log(`[${executionId}] Rendering prompts...`);
      const prompts = await this.loadPrompts(pipelinePath);
      const renderedPrompts: Record<string, string> = {};

      for (const [name, template] of Object.entries(prompts)) {
        renderedPrompts[name] = this.templateRenderer.renderPrompt(template, {
          inputs: jobData.inputs,
          vars,
          data: processorResult.attributes,
        });
      }

      // ========================================================================
      // STEP 4: LLM Enrichment with structured JSON extraction
      // ========================================================================
      console.log(`[${executionId}] Calling LLM for enrichment...`);
      const llmResult = await this.llmProvider.generate(config.llm, {
        prompt: renderedPrompts.main! || Object.values(renderedPrompts)[0]!,
        extractJson: true,
      });

      const llmEnrichment: LLMEnrichmentResult = {
        attributes: llmResult.json || {},
        rawOutput: llmResult.text,
        metadata: {
          tokensUsed: llmResult.usage?.totalTokens,
          model: llmResult.model,
          provider: llmResult.provider,
        },
      };

      console.log(
        `[${executionId}] LLM tokens used: ${llmResult.usage?.totalTokens}`
      );

      // ========================================================================
      // STEP 5: Build complete template context
      // ========================================================================
      const templateContext: TemplateContext = {
        inputs: jobData.inputs,
        vars,
        data: processorResult.attributes,
        llm: llmEnrichment.attributes,
        metadata: {
          executionTime: Date.now() - startTime,
          model: llmResult.model,
          timestamp: new Date().toISOString(),
          pipelineName: jobData.pipelineName,
          version: spec.pipeline.version,
          tokensUsed: llmResult.usage?.totalTokens,
        },
      };

      // ========================================================================
      // STEP 6: Render final template
      // ========================================================================
      console.log(`[${executionId}] Rendering template...`);
      const template = await this.loadTemplate(
        pipelinePath,
        jobData.outputFormat
      );
      const finalOutput = this.templateRenderer.render(
        template,
        templateContext
      );

      // ========================================================================
      // STEP 7: Save output
      // ========================================================================
      const outputPath = await this.saveOutput(
        pipelinePath,
        finalOutput,
        jobData.outputFormat,
        executionId
      );
      console.log(`[${executionId}] Output saved: ${outputPath}`);

      // ========================================================================
      // STEP 8: Update database with success
      // ========================================================================
      await this.db.updateStatus(executionId, "completed", {
        completedAt: Date.now(),
        executionTime: Date.now() - startTime,
        outputPath,
        bundlePath,
        processorMetadata: processorResult.metadata,
        llmMetadata: llmEnrichment.metadata,
        tokensUsed: llmResult.usage?.totalTokens,
      });

      console.log(
        `[${executionId}] ✓ Execution completed in ${Date.now() - startTime}ms`
      );
    } catch (error: any) {
      logger.error(`Execution failed: ${error.message}`);
      await this.db.updateStatus(executionId, "failed", {
        completedAt: Date.now(),
        executionTime: Date.now() - startTime,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute processor.ts with full context
   */
  private async executeProcessor(
    pipelinePath: string,
    inputs: Record<string, unknown>,
    executionId: string
  ): Promise<ProcessorResult> {
    const processorPath = path.join(pipelinePath, "processor.ts");
    const processorUrl = pathToFileURL(processorPath).href;

    // Check if processor exists
    try {
      await fs.access(processorPath);
    } catch {
      throw new Error(`Processor not found: ${processorPath}`);
    }

    // Build context with all libraries and utilities
    const context: ProcessorContext = {
      libs: {
        fetch,
        fs: await import("fs/promises"),
        path: await import("path"),
        csvParse: await import("csv-parse"),
        xml2js: await import("xml2js"),
        cheerio: await import("cheerio"),
        papaparse: await import("papaparse"),
        axios: await import("axios"),
      },
      readDataFile: async (filename: string) => {
        const dataPath = path.join(pipelinePath, "data", filename);
        const content = await fs.readFile(dataPath, "utf-8");

        // Auto-detect file type and parse
        if (filename.endsWith(".json")) {
          return JSON.parse(content);
        } else if (filename.endsWith(".csv")) {
          const Papa = (await import("papaparse")).default;
          return Papa.parse(content, { header: true }).data;
        } else {
          return content;
        }
      },
      saveBundle: async (data: any, filename: string) => {
        const bundlePath = path.join(
          pipelinePath,
          "output",
          "bundles",
          executionId,
          filename
        );
        await fs.mkdir(path.dirname(bundlePath), { recursive: true });
        await fs.writeFile(bundlePath, JSON.stringify(data, null, 2));
        return bundlePath;
      },
      cache: {
        get: async (key: string) => {
          return await this.cacheStore.get(`${pipelinePath}:${key}`);
        },
        set: async (key: string, value: any, ttl?: number) => {
          await this.cacheStore.set(`${pipelinePath}:${key}`, value, ttl);
        },
      },

      logger: {
        info: (msg: string) => console.log(`[${executionId}] INFO:`, msg),
        error: (msg: string) => console.error(`[${executionId}] ERROR:`, msg),
        debug: (msg: string) => console.debug(`[${executionId}] DEBUG:`, msg),
        warn: (msg: string) => console.warn(`[${executionId}] WARN:`, msg),
      },
    };

    // Execute processor
    const cacheBuster = Date.now();

    const processorModule = await import(processorUrl + "?t=" + cacheBuster);

    if (!processorModule.default) {
      throw new Error("Processor must export a default function");
    }

    const result = await processorModule.default(inputs, context);

    // Validate result
    if (!result || typeof result !== "object") {
      throw new Error("Processor must return ProcessorResult object");
    }
    if (!result.attributes || typeof result.attributes !== "object") {
      throw new Error("Processor result must include 'attributes' object");
    }

    return result;
  }

  // Helper methods
  private async loadPrompts(
    pipelinePath: string
  ): Promise<Record<string, string>> {
    const promptsDir = path.join(pipelinePath, "prompts");

    try {
      const files = await fs.readdir(promptsDir);
      const prompts: Record<string, string> = {};

      for (const file of files) {
        if (file.endsWith(".md") || file.endsWith(".prompt.md")) {
          const name = file.replace(/\.prompt\.md$/, "").replace(/\.md$/, "");
          prompts[name] = await fs.readFile(
            path.join(promptsDir, file),
            "utf-8"
          );
        }
      }

      return prompts;
    } catch {
      throw new Error(`Prompts directory not found: ${promptsDir}`);
    }
  }

  private async loadTemplate(
    pipelinePath: string,
    format: string
  ): Promise<string> {
    const templatesDir = path.join(pipelinePath, "templates");

    // Try different naming conventions
    const possibleNames = [
      `report.${format}.njk`,
      `${format}.njk`,
      `template.${format}.njk`,
    ];

    for (const name of possibleNames) {
      const templatePath = path.join(templatesDir, name);
      try {
        return await fs.readFile(templatePath, "utf-8");
      } catch {
        continue;
      }
    }

    throw new Error(`Template not found for format: ${format}`);
  }

  private async saveBundle(
    pipelinePath: string,
    data: any,
    executionId: string
  ): Promise<string> {
    const bundlePath = path.join(
      pipelinePath,
      "output",
      "bundles",
      `${executionId}.json`
    );
    await fs.mkdir(path.dirname(bundlePath), { recursive: true });
    await fs.writeFile(bundlePath, JSON.stringify(data, null, 2));
    return bundlePath;
  }

  private async saveOutput(
    pipelinePath: string,
    content: string,
    format: string,
    executionId: string
  ): Promise<string> {
    const outputPath = path.join(
      pipelinePath,
      "output",
      "reports",
      `${executionId}.${format}`
    );
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, content);
    return outputPath;
  }
}
