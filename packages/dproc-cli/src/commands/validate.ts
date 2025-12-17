import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { PipelineValidator } from "@dproc/core";

export const validateCommand = new Command("validate")
  .description("Validate a pipeline")
  .argument("<pipeline>", "Pipeline name")
  .option("-d, --dir <directory>", "Pipelines directory", "./pipelines")
  .action(async (pipelineName: string, options: { dir: string }) => {
    const spinner = ora("Validating pipeline...").start();

    try {
      const pipelineDir = path.resolve(
        process.cwd(),
        options.dir,
        pipelineName
      );

      const validator = new PipelineValidator();
      const validation = await validator.validate(pipelineDir);

      if (validation.valid) {
        spinner.succeed(chalk.green(`Pipeline "${pipelineName}" is valid!`));
        console.log(chalk.gray(`\nLocation: ${pipelineDir}`));
      } else {
        spinner.fail(chalk.red(`Pipeline "${pipelineName}" validation failed`));
        console.log(chalk.red("\nErrors:"));
        validation.errors.forEach((error: string) => {
          console.log(chalk.red(`  - ${error}`));
        });
        process.exit(1);
      }
    } catch (error: unknown) {
      spinner.fail(chalk.red("Validation failed"));
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });
