import { readFile } from "fs/promises";
import { parse } from "yaml";
import type { SystemConfig, LLMConfig, PipelineSpec } from "@dproc/types";
import path from "path";
import "dotenv/config";

export class ConfigLoader {
  constructor(private baseDir: string = process.cwd()) {}

  /**
   * Load system-wide configuration (dproc.config.yml)
   */
  async loadSystemConfig(): Promise<SystemConfig> {
    const configPath = path.join(this.baseDir, "dproc.config.yml");
    try {
      const content = await readFile(configPath, "utf-8");
      return parse(content) as SystemConfig;
    } catch (error) {
      // Return default config if file doesn't exist
      return {
        providers: {},
        activeProvider: "gemini",
        pipelinesDir: "./pipelines",
        redis: {
          host: "localhost",
          port: 6379,
        },
      };
    }
  }

  /**
   * Load pipeline spec.yml
   */
  async loadPipelineSpec(pipelinePath: string): Promise<PipelineSpec> {
    const specPath = path.join(pipelinePath, "spec.yml");
    const content = await readFile(specPath, "utf-8");
    return parse(content) as PipelineSpec;
  }

  /**
   * Load pipeline config.yml
   */
  async loadPipelineConfig(pipelinePath: string): Promise<LLMConfig> {
    const configPath = path.join(pipelinePath, "config.yml");
    const content = await readFile(configPath, "utf-8");
    return parse(content) as LLMConfig;
  }

  /**
   * Get API key for provider
   */
  getApiKey(provider: "openai" | "anthropic" | "google"): string {
    const envKeys = {
      openai: "OPENAI_API_KEY",
      anthropic: "ANTHROPIC_API_KEY",
      google: "GOOGLE_API_KEY",
    };

    const key = process.env[envKeys[provider]];
    if (!key) {
      throw new Error(
        `Missing API key for ${provider}. Set ${envKeys[provider]} environment variable.`
      );
    }
    return key;
  }
}
