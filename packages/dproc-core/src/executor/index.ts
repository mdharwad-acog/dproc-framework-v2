import { PipelineScanner } from "../pipeline/scanner.js";
import { PipelineLoader } from "../pipeline/loader.js";
import { ReportGenerator } from "../llm/generator.js";
import { TemplateEngine } from "../template/nunjucks.js";
import { MetadataDB } from "../db/sqlite.js";
import type { ExecutionContext, ReportResult } from "@dproc/types";
import { pathToFileURL } from "url";
import createDebug from "debug";

const debug = createDebug("dproc:executor");

export class ReportExecutor {
  private scanner: PipelineScanner;
  private loader: PipelineLoader;
  private generator: ReportGenerator;
  private templateEngine: TemplateEngine;
  private db: MetadataDB;

  constructor(pipelinesDir: string, dbPath: string = "./dproc.db") {
    this.scanner = new PipelineScanner(pipelinesDir);
    this.loader = new PipelineLoader();
    this.generator = new ReportGenerator();
    this.templateEngine = new TemplateEngine();
    this.db = new MetadataDB(dbPath);
  }

  async execute(context: ExecutionContext): Promise<ReportResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    debug("Starting execution", executionId);

    this.db.insertExecution({
      id: executionId,
      pipelineName: context.pipelineName,
      inputs: JSON.stringify(context.inputs),
      outputFormat: context.outputFormat,
      status: "processing",
      createdAt: Date.now(),
    });

    try {
      // Get pipeline path
      const pipelinePath = await this.scanner.getPipelinePath(
        context.pipelineName
      );
      if (!pipelinePath) {
        throw new Error(`Pipeline "${context.pipelineName}" not found`);
      }

      // Load pipeline config
      const config = await this.loader.load(pipelinePath);

      // Load prompt template
      const promptTemplate = await this.loader.getPromptTemplate(
        pipelinePath,
        config
      );

      // Load bundle if exists
      let bundleData;
      if (config.spec.files.bundle) {
        try {
          const bundlePath = `${pipelinePath}/${config.spec.files.bundle}`;

          // Use pathToFileURL for proper cross-platform file URL
          const bundleUrl = pathToFileURL(bundlePath).href;

          // Add cache busting to ensure fresh imports
          const bundleModule = await import(`${bundleUrl}?t=${Date.now()}`);
          bundleData = await bundleModule.default(context.inputs);

          debug("Bundle loaded successfully");
        } catch (error) {
          debug("Bundle loading failed, continuing without bundle:", error);
          // Continue without bundle if it fails
          bundleData = null;
        }
      }

      // Render prompt with inputs and bundle
      const filledPrompt = this.templateEngine.renderPrompt(
        promptTemplate,
        context.inputs,
        bundleData
      );

      debug("Prompt rendered, length:", filledPrompt.length);

      // Generate report using LLM
      const reportResult = await this.generator.generate(
        filledPrompt,
        context.provider
      );

      // Load render template
      const renderTemplate = await this.loader.getRenderTemplate(
        pipelinePath,
        config
      );

      // Render final report
      const finalReport = this.templateEngine.renderReport(
        renderTemplate,
        reportResult.content,
        context.inputs
      );

      const result: ReportResult = {
        content: finalReport,
        format: context.outputFormat,
        metadata: reportResult.metadata,
      };

      // Update with execution metadata
      this.db.updateExecutionStatus(
        executionId,
        "completed",
        undefined,
        result.metadata.executionTime,
        result.metadata.tokensUsed
      );

      debug("Execution completed", executionId);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.db.updateExecutionStatus(executionId, "failed", errorMessage);
      debug("Execution failed", executionId, errorMessage);
      throw error;
    }
  }

  getDatabase(): MetadataDB {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
