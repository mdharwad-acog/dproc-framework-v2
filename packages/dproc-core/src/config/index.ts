import { readFile } from "fs/promises";
import { parse } from "yaml";
import type { SystemConfig, LLMConfig, PipelineSpec } from "@aganitha/dproc-types";
import path from "path";
import { SecretsManager } from "./secrets.js";
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
  // getApiKey(provider: "openai" | "anthropic" | "google"): string {
  //   const envKeys = {
  //     openai: "OPENAI_API_KEY",
  //     anthropic: "ANTHROPIC_API_KEY",
  //     google: "GOOGLE_API_KEY",
  //   };

  //   const key = process.env[envKeys[provider]];
  //   if (!key) {
  //     throw new Error(
  //       `Missing API key for ${provider}. Set ${envKeys[provider]} environment variable.`
  //     );
  //   }
  //   return key;
  // }

  // Add to ConfigLoader class
  private secretsManager = new SecretsManager();

  /**
   * Get API key with priority: ENV > secrets.json
   */
  getApiKey(provider: "openai" | "anthropic" | "google"): string {
    // Priority 1: Environment variable
    const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
    if (envKey) {
      return envKey;
    }

    // Priority 2: Secrets file (synchronous read for simplicity)
    try {
      const secrets = require("fs").readFileSync(
        this.secretsManager.getSecretsPath(),
        "utf-8"
      );
      const parsed = JSON.parse(secrets);
      if (parsed.apiKeys[provider]) {
        return parsed.apiKeys[provider];
      }
    } catch {
      // Secrets file doesn't exist or can't be read
    }

    throw new Error(
      `No API key found for ${provider}. Set ${provider.toUpperCase()}_API_KEY environment variable or run 'dproc configure'`
    );
  }
}

export { SecretsManager } from "./secrets.js";
export type { Secrets } from "./secrets.js";
export { WorkspaceManager } from "./workspace.js";
