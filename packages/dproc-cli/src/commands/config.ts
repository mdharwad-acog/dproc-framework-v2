import { Command } from "commander";
import chalk from "chalk";
import { ConfigManager } from "@dproc/core";
import { ProviderConfig } from "@dproc/types";

export const configCommand = new Command("config").description(
  "Manage configuration"
);

configCommand
  .command("init")
  .description("Initialize default configuration")
  .option("-d, --dir <directory>", "Pipelines directory", "./pipelines")
  .action(async (options: { dir: string }) => {
    try {
      const configManager = new ConfigManager();
      await configManager.createDefaultConfig(options.dir);
      console.log(chalk.green("Configuration initialized successfully!"));
      console.log(chalk.cyan(`Config file: dproc.config.yml`));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red("Failed to initialize configuration"));
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });

configCommand
  .command("set")
  .description("Set configuration value")
  .argument("<key>", "Configuration key (e.g., activeProvider)")
  .argument("<value>", "Configuration value")
  .action(async (key: string, value: string) => {
    try {
      const configManager = new ConfigManager();
      await configManager.load();

      if (key === "activeProvider") {
        await configManager.setActiveProvider(value);
        console.log(chalk.green(`Active provider set to: ${value}`));
      } else {
        console.error(chalk.red(`Unknown configuration key: ${key}`));
        process.exit(1);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red("Failed to update configuration"));
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });

configCommand
  .command("add-provider")
  .description("Add a new LLM provider")
  .requiredOption("-n, --name <name>", "Provider name")
  .requiredOption(
    "-t, --type <type>",
    "Provider type (openai, anthropic, google)"
  )
  .requiredOption("-k, --key <key>", "API key")
  .requiredOption("-m, --model <model>", "Model name")
  .option("--temperature <temp>", "Temperature", "0.7")
  .option("--max-tokens <tokens>", "Max tokens", "4000")
  .action(
    async (options: {
      name: string;
      type: "openai" | "anthropic" | "google";
      key: string;
      model: string;
      temperature: string;
      maxTokens: string;
    }) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();

        const provider: ProviderConfig = {
          type: options.type,
          apiKey: options.key,
          model: options.model,
          temperature: parseFloat(options.temperature),
          maxTokens: parseInt(options.maxTokens, 10),
        };

        await configManager.updateProvider(options.name, provider);
        console.log(
          chalk.green(`Provider "${options.name}" added successfully!`)
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(chalk.red("Failed to add provider"));
        console.error(chalk.red(errorMessage));
        process.exit(1);
      }
    }
  );

configCommand
  .command("show")
  .description("Show current configuration")
  .action(async () => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.load();

      console.log(chalk.cyan("Current Configuration:"));
      console.log(chalk.gray("─".repeat(50)));
      console.log(chalk.white(`Pipelines Directory: ${config.pipelinesDir}`));
      console.log(chalk.white(`Active Provider: ${config.activeProvider}`));
      console.log(chalk.cyan("\nConfigured Providers:"));
      Object.entries(config.providers).forEach(([name, provider]) => {
        console.log(chalk.white(`  ${name}:`));
        console.log(chalk.gray(`    Type: ${provider.type}`));
        console.log(chalk.gray(`    Model: ${provider.model}`));
        console.log(chalk.gray(`    Temperature: ${provider.temperature}`));
        console.log(chalk.gray(`    Max Tokens: ${provider.maxTokens}`));
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red("Failed to load configuration"));
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });
