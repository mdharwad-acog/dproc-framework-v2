import { NextResponse } from "next/server";
import {
  PipelineScanner,
  PipelineLoader,
  ReportGenerator,
  TemplateEngine,
  MetadataDB,
} from "@dproc/core";
import type { ProviderConfig } from "@dproc/types";

const PIPELINES_DIR = process.env.PIPELINES_DIR || "./pipelines";

interface ExecuteRequest {
  pipelineName: string;
  inputs: Record<string, any>;
  outputFormat: string;
  provider: "openai" | "anthropic" | "google";
  model: string;
  userApiKey?: string;
}

export async function POST(req: Request) {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const body: ExecuteRequest = await req.json();
    const { pipelineName, inputs, outputFormat, provider, model, userApiKey } =
      body;

    // HYBRID MODEL: Priority - User key > System key > Error
    const apiKey =
      userApiKey || process.env[`${provider.toUpperCase()}_API_KEY`];

    if (!apiKey) {
      return NextResponse.json(
        {
          error: `No API key available for ${provider}. Please provide your own key or contact administrator.`,
          requiresUserKey: true,
        },
        { status: 400 }
      );
    }

    const providerConfig: ProviderConfig = {
      type: provider,
      apiKey,
      model,
      temperature: 0.7,
      maxTokens: 4096,
    };

    // Initialize database
    const db = new MetadataDB("./dproc.db");
    db.insertExecution({
      id: executionId,
      pipelineName,
      inputs: JSON.stringify(inputs),
      outputFormat,
      status: "processing",
      createdAt: Date.now(),
    });

    // Get pipeline path
    const scanner = new PipelineScanner(PIPELINES_DIR);
    const pipelinePath = await scanner.getPipelinePath(pipelineName);

    if (!pipelinePath) {
      throw new Error(`Pipeline "${pipelineName}" not found`);
    }

    // Load pipeline config
    const loader = new PipelineLoader();
    const config = await loader.load(pipelinePath);

    // Load prompt template
    const promptTemplate = await loader.getPromptTemplate(pipelinePath, config);

    // Render prompt (skip bundle for web UI)
    const templateEngine = new TemplateEngine();
    const filledPrompt = templateEngine.renderPrompt(
      promptTemplate,
      inputs,
      null
    );

    // Generate report
    const generator = new ReportGenerator();
    const reportResult = await generator.generate(filledPrompt, providerConfig);

    // Load render template
    const renderTemplate = await loader.getRenderTemplate(pipelinePath, config);

    // Render final report
    const finalReport = templateEngine.renderReport(
      renderTemplate,
      reportResult.content,
      inputs
    );

    // Update database
    db.updateExecutionStatus(
      executionId,
      "completed",
      undefined,
      reportResult.metadata.executionTime,
      reportResult.metadata.tokensUsed
    );
    db.close();

    return NextResponse.json({
      success: true,
      report: finalReport,
      metadata: reportResult.metadata,
      keySource: userApiKey ? "user" : "system",
    });
  } catch (error) {
    console.error("Execution error:", error);

    // Update database with error
    try {
      const db = new MetadataDB("./dproc.db");
      db.updateExecutionStatus(executionId, "failed", String(error));
      db.close();
    } catch {}

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
