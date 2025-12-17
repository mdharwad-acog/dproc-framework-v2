import fs from "fs/promises";
import path from "path";
import { PipelineFileConfigSchema } from "@dproc/types";
import { parse } from "yaml";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class PipelineValidator {
  async validate(pipelinePath: string): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Check config.yml exists
      const configPath = path.join(pipelinePath, "config.yml");
      const configContent = await fs.readFile(configPath, "utf-8");
      const config = parse(configContent);

      // Validate schema using PipelineFileConfigSchema
      const result = PipelineFileConfigSchema.safeParse(config);
      if (!result.success) {
        result.error.errors.forEach((err) => {
          errors.push(
            `Config validation: ${err.path.join(".")}: ${err.message}`
          );
        });
      } else {
        // Only check files if schema is valid
        const validConfig = result.data;

        // Check required files exist
        if (validConfig.spec.files.prompts) {
          try {
            await fs.access(
              path.join(pipelinePath, validConfig.spec.files.prompts)
            );
          } catch {
            errors.push(
              `Missing prompts file: ${validConfig.spec.files.prompts}`
            );
          }
        }

        if (validConfig.spec.files.template) {
          try {
            await fs.access(
              path.join(pipelinePath, validConfig.spec.files.template)
            );
          } catch {
            errors.push(
              `Missing template file: ${validConfig.spec.files.template}`
            );
          }
        }

        if (validConfig.spec.files.mdxTemplate) {
          try {
            await fs.access(
              path.join(pipelinePath, validConfig.spec.files.mdxTemplate)
            );
          } catch {
            errors.push(
              `Missing MDX template file: ${validConfig.spec.files.mdxTemplate}`
            );
          }
        }

        if (validConfig.spec.files.bundle) {
          try {
            await fs.access(
              path.join(pipelinePath, validConfig.spec.files.bundle)
            );
          } catch {
            errors.push(
              `Missing bundle file: ${validConfig.spec.files.bundle}`
            );
          }
        }

        // Validate inputs
        if (validConfig.spec.inputs.length === 0) {
          errors.push("Pipeline must have at least one input");
        }

        // Validate outputs
        if (validConfig.spec.outputs.length === 0) {
          errors.push("Pipeline must have at least one output format");
        }
      }
    } catch (error) {
      errors.push(`Failed to read pipeline: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
