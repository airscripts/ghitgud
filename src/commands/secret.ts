import { Command } from "commander";

import command from "@/core/command";
import secretsService from "@/services/secrets";

const register = (program: Command) => {
  const secret = program
    .command("secret")
    .description("Manage repository, environment, and organization secrets.");

  secret
    .command("list")
    .description("List secrets.")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .action(async (options) => {
      await command.run(() => secretsService.list(options));
    });

  secret
    .command("set")
    .description("Set a secret.")
    .requiredOption("--name <key>", "Secret name")
    .requiredOption("--value <val>", "Secret value")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .option(
      "--visibility <visibility>",
      "Visibility for org secrets: all, private, selected",
    )
    .option(
      "--repos <repos>",
      "Comma-separated repo list for selected visibility",
    )
    .action(async (options) => {
      await command.run(() => secretsService.set(options));
    });

  secret
    .command("delete")
    .description("Delete a secret.")
    .requiredOption("--name <key>", "Secret name")
    .option("--env <name>", "Environment name")
    .option("--org <org>", "Organization name")
    .action(async (options) => {
      await command.run(() => secretsService.remove(options));
    });
};

export default { register };
