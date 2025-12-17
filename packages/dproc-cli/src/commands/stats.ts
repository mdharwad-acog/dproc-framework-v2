import { Command } from "commander";
import chalk from "chalk";
import { MetadataDB } from "@dproc/core";

export const statsCommand = new Command("stats")
  .description("Show aggregated usage statistics")
  .action(async () => {
    try {
      const db = new MetadataDB("./dproc.db");
      const executions = db.listExecutions(undefined, 1000);

      if (executions.length === 0) {
        console.log(chalk.yellow("No executions found."));
        db.close();
        return;
      }

      const totalReports = executions.length;
      const completed = executions.filter((e) => e.status === "completed");
      const failedReports = executions.filter(
        (e) => e.status === "failed"
      ).length;

      const avgTimeMs =
        completed.length > 0
          ? completed.reduce((sum, e) => sum + (e.executionTime || 0), 0) /
            completed.length
          : 0;

      const totalTokens = completed.reduce(
        (sum, e) => sum + (e.tokensUsed || 0),
        0
      );

      const estimatedCost = (totalTokens / 1000) * 0.01;

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const reportsThisWeek = executions.filter(
        (e) => e.createdAt > oneWeekAgo
      ).length;

      const successRate =
        totalReports > 0
          ? Math.round((completed.length / totalReports) * 100)
          : 0;

      db.close();

      console.log(chalk.cyan("\nDProc Usage Statistics\n"));
      console.log(chalk.white("  Total reports:   "), totalReports);
      console.log(chalk.white("  Reports this week:"), reportsThisWeek);
      console.log(
        chalk.white("  Avg time:        "),
        `${(avgTimeMs / 1000).toFixed(2)}s`
      );
      console.log(
        chalk.white("  Total tokens:    "),
        totalTokens.toLocaleString()
      );
      console.log(
        chalk.white("  Est. cost:       "),
        `$${estimatedCost.toFixed(2)}`
      );
      console.log(
        chalk.white("  Success rate:    "),
        `${successRate}% (failed: ${failedReports})`
      );
      console.log();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(chalk.red("Failed to compute stats"));
      console.error(chalk.red(errorMessage));
      process.exit(1);
    }
  });
