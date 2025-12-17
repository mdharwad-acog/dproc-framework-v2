import fs from "fs/promises";
import path from "path";
import { parse } from "yaml";
import type { PipelineSpec } from "@dproc/types";
import { PipelineValidator } from "./validator.js";
import createDebug from "debug";

const debug = createDebug("dproc:scanner");

export interface PipelineInfo {
  name: string;
  path: string;
  spec: PipelineSpec;
}

export class PipelineScanner {
  private validator: PipelineValidator;

  constructor(private pipelinesDir: string) {
    this.validator = new PipelineValidator();
  }

  async scan(): Promise<Map<string, string>> {
    const pipelines = new Map<string, string>();

    try {
      const entries = await fs.readdir(this.pipelinesDir, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const configPath = path.join(
            this.pipelinesDir,
            entry.name,
            "config.yml"
          );

          try {
            await fs.access(configPath);
            pipelines.set(entry.name, path.join(this.pipelinesDir, entry.name));
            debug(`Found pipeline: ${entry.name}`);
          } catch {
            debug(`Skipping ${entry.name}: no config.yml found`);
          }
        }
      }
    } catch (error) {
      debug(`Error scanning pipelines directory: ${error}`);
      throw new Error(
        `Failed to scan pipelines directory: ${this.pipelinesDir}`
      );
    }

    return pipelines;
  }

  async scanPipelines(): Promise<PipelineInfo[]> {
    const pipelines = await this.scan();
    const results: PipelineInfo[] = [];

    for (const [name, pipelinePath] of pipelines) {
      const configPath = path.join(pipelinePath, "config.yml");
      const content = await fs.readFile(configPath, "utf-8");
      const config = parse(content);

      results.push({
        name,
        path: pipelinePath,
        spec: config.spec,
      });
    }

    return results;
  }

  async getPipelinePath(name: string): Promise<string | null> {
    const pipelines = await this.scan();
    return pipelines.get(name) || null;
  }

  async validatePipeline(name: string) {
    const pipelinePath = await this.getPipelinePath(name);
    if (!pipelinePath) {
      return {
        valid: false,
        errors: [`Pipeline "${name}" not found`],
      };
    }

    return this.validator.validate(pipelinePath);
  }
}
