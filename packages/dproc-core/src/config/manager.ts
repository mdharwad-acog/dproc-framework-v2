import fs from "fs/promises";
import { parse, stringify } from "yaml";
import type { SystemConfig, ProviderConfig } from "@dproc/types";
import createDebug from "debug";

const debug = createDebug("dproc:config");

export class ConfigManager {
  private configPath: string;
  private config?: SystemConfig;

  constructor(configPath: string = "./dproc.config.yml") {
    this.configPath = configPath;
  }

  async load(): Promise<SystemConfig> {
    try {
      const content = await fs.readFile(this.configPath, "utf-8");
      this.config = parse(content) as SystemConfig;
      debug("Configuration loaded from", this.configPath);
      return this.config;
    } catch (error) {
      throw new Error(
        `Failed to load config from ${this.configPath}: ${error}`
      );
    }
  }

  async save(): Promise<void> {
    if (!this.config) {
      throw new Error("No configuration to save");
    }

    try {
      const content = stringify(this.config);
      await fs.writeFile(this.configPath, content, "utf-8");
      debug("Configuration saved to", this.configPath);
    } catch (error) {
      throw new Error(`Failed to save config to ${this.configPath}: ${error}`);
    }
  }

  async createDefaultConfig(pipelinesDir: string): Promise<void> {
    const defaultConfig: SystemConfig = {
      providers: {
        openai: {
          type: "openai",
          apiKey: process.env.OPENAI_API_KEY || "your-openai-api-key",
          model: "gpt-4",
          temperature: 0.7,
          maxTokens: 4096,
        },
      },
      activeProvider: "openai",
      pipelinesDir,
    };

    this.config = defaultConfig;
    await this.save();
  }

  getActiveProvider(): ProviderConfig {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }

    const provider = this.config.providers[this.config.activeProvider];
    if (!provider) {
      throw new Error(
        `Active provider "${this.config.activeProvider}" not found`
      );
    }

    return provider;
  }

  async setActiveProvider(providerName: string): Promise<void> {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }

    if (!this.config.providers[providerName]) {
      throw new Error(`Provider "${providerName}" not found`);
    }

    this.config.activeProvider = providerName;
    await this.save();
  }

  async updateProvider(name: string, provider: ProviderConfig): Promise<void> {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }

    this.config.providers[name] = provider;
    await this.save();
  }

  getConfig(): SystemConfig | undefined {
    return this.config;
  }
}
