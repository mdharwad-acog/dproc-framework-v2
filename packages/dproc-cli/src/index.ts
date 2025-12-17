#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { executeCommand } from "./commands/execute.js";
import { listCommand } from "./commands/list.js";
import { validateCommand } from "./commands/validate.js";
import { configCommand } from "./commands/config.js";
import { historyCommand } from "./commands/history.js";
import { statsCommand } from "./commands/stats.js";

const program = new Command();

program
  .name("dproc")
  .description("DProc Framework - LLM-powered report generation")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(executeCommand);
program.addCommand(listCommand);
program.addCommand(validateCommand);
program.addCommand(configCommand);
program.addCommand(historyCommand);
program.addCommand(statsCommand);

program.parse();
