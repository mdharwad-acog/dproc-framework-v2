import fs from "fs/promises";
import path from "path";
import { parse } from "yaml";
import {
  PipelineFileConfigSchema,
  type PipelineFileConfig,
  type PipelineSpec,
} from "@dproc/types";
import createDebug from "debug";

const debug = createDebug("dproc:loader");

export class PipelineLoader {
  async load(pipelinePath: string): Promise<PipelineFileConfig> {
    const configPath = path.join(pipelinePath, "config.yml");

    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      const rawConfig = parse(configContent);

      // Validate using the correct schema (PipelineFileConfig, not PipelineConfig)
      const config = PipelineFileConfigSchema.parse(rawConfig);

      debug(`Loaded pipeline config from ${configPath}`);
      return config;
    } catch (error) {
      debug(`Error loading pipeline config: ${error}`);
      throw new Error(
        `Failed to load pipeline config from ${configPath}: ${error}`
      );
    }
  }

  async getPromptTemplate(
    pipelinePath: string,
    config: PipelineFileConfig
  ): Promise<string> {
    const promptPath = path.join(pipelinePath, config.spec.files.prompts);
    return await fs.readFile(promptPath, "utf-8");
  }

  async getRenderTemplate(
    pipelinePath: string,
    config: PipelineFileConfig
  ): Promise<string> {
    const templatePath = path.join(pipelinePath, config.spec.files.template);
    return await fs.readFile(templatePath, "utf-8");
  }

  async getMdxTemplate(
    pipelinePath: string,
    config: PipelineFileConfig
  ): Promise<string | null> {
    if (!config.spec.files.mdxTemplate) return null;

    const mdxPath = path.join(pipelinePath, config.spec.files.mdxTemplate);
    try {
      return await fs.readFile(mdxPath, "utf-8");
    } catch {
      return null;
    }
  }
}
