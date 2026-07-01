import { Command } from "commander";

import command from "@/core/command";
import prompt from "@/core/prompt";
import aliasService from "@/services/alias";

const register = (program: Command) => {
  const alias = program.command("alias").description("Manage command aliases.");

  alias
    .command("set")
    .description("Create or replace an alias.")
    .arguments("<name> <expansion>")
    .option("--force", "Overwrite existing alias")
    .action(async (name: string, expansion: string, options) => {
      await command.run(() =>
        aliasService.set(name, expansion, options.force ?? false),
      );
    });

  alias
    .command("list")
    .description("List configured aliases.")
    .action(async () => {
      await command.run(() => aliasService.list());
    });

  alias
    .command("delete")
    .description("Remove an alias.")
    .arguments("<name>")
    .action(async (name: string) => {
      await command.run(() => aliasService.deleteAlias(name));
    });

  alias
    .command("import")
    .description("Import aliases from a file or standard input.")
    .arguments("[file]")
    .action(async (file?: string) => {
      let filePath = file;

      if (!filePath) {
        if (prompt.isNonInteractive()) {
          await command.run(() => aliasService.importAliases());
          return;
        }

        filePath = await prompt.text("Path to aliases file:");
      }

      await command.run(() => aliasService.importAliases(filePath));
    });
};

export default { register };
