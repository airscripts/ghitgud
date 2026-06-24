import { Command } from "commander";

import command from "@/core/command";
import repoResolver from "@/core/repo";
import variablesService from "@/services/variables";

const register = (program: Command) => {
  const variable = program
    .command("variable")
    .description("Manage repository, environment, and organization variables.");

  variable
    .command("list")
    .description("List variables.")
    .option("--repo <owner/repo>", "Repository")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .action(async (options) => {
      const repo = options.repo
        ? await repoResolver.resolveRepo(options.repo)
        : undefined;

      await command.run(() => variablesService.list({ ...options, repo }));
    });

  variable
    .command("set")
    .description("Set a variable.")
    .requiredOption("--name <key>", "Variable name")
    .requiredOption("--value <val>", "Variable value")
    .option("--repo <owner/repo>", "Repository")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .action(async (options) => {
      const repo = options.repo
        ? await repoResolver.resolveRepo(options.repo)
        : undefined;

      await command.run(() => variablesService.set({ ...options, repo }));
    });

  variable
    .command("delete")
    .description("Delete a variable.")
    .requiredOption("--name <key>", "Variable name")
    .option("--repo <owner/repo>", "Repository")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .action(async (options) => {
      const repo = options.repo
        ? await repoResolver.resolveRepo(options.repo)
        : undefined;

      await command.run(() => variablesService.remove({ ...options, repo }));
    });
};

export default { register };
