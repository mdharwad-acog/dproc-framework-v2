import { Command } from "commander";
import chalk from "chalk";
import { ConfigManager, PipelineScanner } from "@dproc/core";

export const listCommand = new Command("list")
  .description("List all available pipelines")
  .option("-c, --config <path>", "Config file path", "./dproc.config.yml")
  .action(async (options: { config: string }) => {
    try {
      const configManager = new ConfigManager(options.config);
      const config = await configManager.load();

      const scanner = new PipelineScanner(config.pipelinesDir);
      const pipelines = await scanner.scanPipelines();

      if (pipelines.length === 0) {
        console.log(chalk.yellow("No pipelines found."));
        console.log(chalk.gray(`Create one with: dproc init <name>`));
        return;
      }

      console.log(chalk.cyan(`\nFound ${pipelines.length} pipeline(s):\n`));

      for (const pipeline of pipelines) {
        console.log(chalk.white(`📋 ${pipeline.name}`));
        console.log(chalk.gray(`   ${pipeline.spec.description}`));
        console.log(chalk.gray(`   Version: ${pipeline.spec.version}`));
        console.log(
          chalk.gray(`   Outputs: ${pipeline.spec.outputs.join(", ")}`)
        );
        console.log(chalk.gray(`   Inputs: ${pipeline.spec.inputs.length}`));
        console.log();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red("Failed to list pipelines"));
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });
