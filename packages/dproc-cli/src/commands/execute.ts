import { Command } from "commander";
import fs from "fs/promises";
import chalk from "chalk";
import ora from "ora";
import { ConfigManager, ReportExecutor } from "@dproc/core";

export const executeCommand = new Command("execute")
  .description("Execute a pipeline and generate report")
  .argument("<pipeline>", "Pipeline name")
  .option("-d, --pipelines-dir <dir>", "Pipelines directory", "./pipelines")
  .option("-o, --output <path>", "Output file path")
  .option("-f, --format <format>", "Output format", "md")
  .option("-i, --input <key=value...>", 'Input values (e.g., -i topic="AI")')
  .option("--provider <provider>", "LLM provider", "openai")
  .option("--model <model>", "Model name", "gpt-4")
  .option(
    "--api-key <key>",
    "API key (optional, uses env vars if not provided)"
  )
  .action(
    async (
      pipelineName: string,
      options: {
        pipelinesDir: string;
        output?: string;
        format: string;
        input?: string[];
        provider: string;
        model: string;
        apiKey?: string;
      }
    ) => {
      const spinner = ora("Executing pipeline...").start();

      try {
        // Parse inputs
        const inputs: Record<string, string> = {};
        if (options.input) {
          for (const input of options.input) {
            const [key, value] = input.split("=");
            inputs[key.trim()] = value.trim();
          }
        }

        // Get API key
        const apiKey =
          options.apiKey ||
          process.env[`${options.provider.toUpperCase()}_API_KEY`];

        if (!apiKey) {
          spinner.fail(chalk.red(`No API key found for ${options.provider}`));
          console.log(
            chalk.yellow(
              `Set ${options.provider.toUpperCase()}_API_KEY or use --api-key`
            )
          );
          process.exit(1);
        }

        const providerConfig = {
          type: options.provider as "openai" | "anthropic" | "google",
          apiKey,
          model: options.model,
          temperature: 0.7,
          maxTokens: 4096,
        };

        spinner.text = "Loading pipeline...";

        const executor = new ReportExecutor(options.pipelinesDir);

        spinner.text = "Generating report...";

        const result = await executor.execute({
          pipelineName,
          inputs,
          outputFormat: options.format,
          provider: providerConfig,
        });

        spinner.succeed(chalk.green("Report generated successfully!"));

        console.log(
          chalk.cyan(`\nExecution time: ${result.metadata.executionTime}ms`)
        );
        console.log(
          chalk.cyan(`Tokens used: ${result.metadata.tokensUsed || "N/A"}`)
        );
        console.log(chalk.cyan(`Model: ${result.metadata.model}`));

        const outputPath =
          options.output ||
          `${pipelineName}-report-${Date.now()}.${options.format}`;

        await fs.writeFile(outputPath, result.content, "utf-8");
        console.log(chalk.green(`\nReport saved to: ${outputPath}`));

        executor.close();
      } catch (error: unknown) {
        spinner.fail(chalk.red("Execution failed"));
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    }
  );
