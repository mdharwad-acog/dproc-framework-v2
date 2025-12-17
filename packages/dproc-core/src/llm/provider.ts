import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ProviderConfig } from "@dproc/types";
import type { LanguageModel } from "ai";

export class LLMProvider {
  getModel(config: ProviderConfig): LanguageModel {
    switch (config.type) {
      case "openai": {
        const openai = createOpenAI({
          apiKey: config.apiKey,
        });
        return openai(config.model);
      }

      case "anthropic": {
        const anthropic = createAnthropic({
          apiKey: config.apiKey,
        });
        return anthropic(config.model);
      }

      case "google": {
        const google = createGoogleGenerativeAI({
          apiKey: config.apiKey,
        });
        return google(config.model);
      }

      default:
        throw new Error(`Unsupported provider: ${config.type}`);
    }
  }
}
