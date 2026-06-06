import { Command } from "commander";

import command from "@/core/command";
import variablesService from "@/services/variables";

const register = (program: Command) => {
  const variable = program
    .command("variable")
    .description("Manage repository, environment, and organization variables.");

  variable
    .command("list")
    .description("List variables.")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .action(async (options) => {
      await command.run(() => variablesService.list(options));
    });

  variable
    .command("set")
    .description("Set a variable.")
    .requiredOption("--name <key>", "Variable name")
    .requiredOption("--value <val>", "Variable value")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .action(async (options) => {
      await command.run(() => variablesService.set(options));
    });

  variable
    .command("delete")
    .description("Delete a variable.")
    .requiredOption("--name <key>", "Variable name")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .action(async (options) => {
      await command.run(() => variablesService.remove(options));
    });
};

export default { register };
