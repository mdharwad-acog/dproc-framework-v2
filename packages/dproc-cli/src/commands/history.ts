import { Command } from "commander";
import chalk from "chalk";
import { MetadataDB, type ExecutionRecord } from "@dproc/core";

export const historyCommand = new Command("history")
  .description("Show execution history")
  .option("-p, --pipeline <name>", "Filter by pipeline name")
  .option("-l, --limit <number>", "Number of records to show", "20")
  .action(async (options: { pipeline?: string; limit: string }) => {
    try {
      const db = new MetadataDB("./dproc.db");
      const executions = db.listExecutions(
        options.pipeline,
        parseInt(options.limit, 10)
      );

      if (executions.length === 0) {
        console.log(chalk.yellow("No execution history found."));
        db.close();
        return;
      }

      console.log(
        chalk.cyan(
          `\nExecution History (${executions.length} record${
            executions.length === 1 ? "" : "s"
          }):\n`
        )
      );

      executions.forEach((exec: ExecutionRecord) => {
        const statusColor =
          exec.status === "completed"
            ? chalk.green
            : exec.status === "failed"
              ? chalk.red
              : chalk.yellow;

        console.log(
          chalk.white(`#${exec.id} `) +
            chalk.bold(exec.pipelineName) +
            " " +
            statusColor(`(${exec.status})`)
        );
        console.log(
          chalk.gray(
            `   Created:   ${new Date(exec.createdAt).toLocaleString()}`
          )
        );
        if (exec.completedAt) {
          console.log(
            chalk.gray(
              `   Completed: ${new Date(exec.completedAt).toLocaleString()}`
            )
          );
        }
        if (exec.executionTime != null) {
          console.log(chalk.gray(`   Time:      ${exec.executionTime}ms`));
        }
        if (exec.tokensUsed != null) {
          console.log(
            chalk.gray(`   Tokens:    ${exec.tokensUsed.toLocaleString()}`)
          );
        }
        console.log(chalk.gray(`   Format:    ${exec.outputFormat}`));
        if (exec.error) {
          console.log(chalk.red(`   Error:     ${exec.error}`));
        }
        console.log();
      });

      db.close();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red("Failed to load history"));
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });
