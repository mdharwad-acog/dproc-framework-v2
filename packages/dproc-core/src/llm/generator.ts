import { generateText } from "ai";
import { LLMProvider } from "./provider.js";
import type { ProviderConfig, ReportResult } from "@dproc/types";
import createDebug from "debug";

const debug = createDebug("dproc:generator");

export class ReportGenerator {
  private provider: LLMProvider;

  constructor() {
    this.provider = new LLMProvider();
  }

  async generate(
    prompt: string,
    providerConfig: ProviderConfig
  ): Promise<ReportResult> {
    const startTime = Date.now();
    const model = this.provider.getModel(providerConfig);

    try {
      debug("Generating report with model:", providerConfig.model);

      const result = await generateText({
        model,
        prompt,
        temperature: providerConfig.temperature ?? 0.7,
        maxTokens: providerConfig.maxTokens ?? 4096,
      });

      const executionTime = Date.now() - startTime;

      debug(`Report generated in ${executionTime}ms`);

      return {
        content: result.text,
        format: "md",
        metadata: {
          executionTime,
          tokensUsed: result.usage.totalTokens,
          model: providerConfig.model,
        },
      };
    } catch (error) {
      debug("Error generating report:", error);
      throw new Error(`Failed to generate report: ${error}`);
    }
  }
}
