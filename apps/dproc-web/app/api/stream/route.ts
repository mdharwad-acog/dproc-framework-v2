import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { PipelineScanner, PipelineLoader, TemplateEngine } from "@dproc/core";

const PIPELINES_DIR = process.env.PIPELINES_DIR || "./pipelines";

export async function POST(req: Request) {
  try {
    const { pipelineName, inputs, provider, model, userApiKey } =
      await req.json();

    // HYBRID MODEL
    const apiKey =
      userApiKey || process.env[`${provider.toUpperCase()}_API_KEY`];

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No API key available" }), {
        status: 400,
      });
    }

    // Load pipeline
    const scanner = new PipelineScanner(PIPELINES_DIR);
    const pipelinePath = await scanner.getPipelinePath(pipelineName);

    if (!pipelinePath) {
      return new Response(JSON.stringify({ error: "Pipeline not found" }), {
        status: 404,
      });
    }

    const loader = new PipelineLoader();
    const config = await loader.load(pipelinePath);
    const promptTemplate = await loader.getPromptTemplate(pipelinePath, config);

    // Render prompt (skip bundle for web UI)
    const templateEngine = new TemplateEngine();
    const prompt = templateEngine.renderPrompt(promptTemplate, inputs, null);

    // Get LLM model
    let llmModel;
    switch (provider) {
      case "openai":
        llmModel = createOpenAI({ apiKey })(model);
        break;
      case "anthropic":
        llmModel = createAnthropic({ apiKey })(model);
        break;
      case "google":
        llmModel = createGoogleGenerativeAI({ apiKey })(model);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Stream response
    const result = streamText({
      model: llmModel,
      prompt,
      temperature: 0.7,
      maxTokens: 4096,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Stream error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
    });
  }
}
