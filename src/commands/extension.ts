import { Command } from "commander";

import command from "@/core/command";
import extensionService from "@/services/extension";
import prompt from "@/core/prompt";

const register = (program: Command) => {
  const ext = program
    .command("extension")
    .description("Manage ghg CLI extensions.");

  ext
    .command("list")
    .description("List installed extensions.")
    .action(async () => {
      await command.run(() => extensionService.list());
    });

  ext
    .command("install <repo>")
    .description("Install an extension from a git repository.")
    .action(async (repo: string) => {
      await command.run(() => extensionService.install(repo));
    });

  ext
    .command("remove <name>")
    .description("Remove an installed extension.")
    .option("--yes", "Confirm removal")
    .action(async (name: string, options: { yes?: boolean }) => {
      if (!options.yes) {
        prompt.guardNonInteractive("Extension removal requires --yes.");
        if (!(await prompt.confirm(`Remove extension "${name}"?`))) return;
      }
      await command.run(() => extensionService.remove(name));
    });

  ext
    .command("upgrade <name>")
    .description("Upgrade an installed extension.")
    .action(async (name: string) => {
      await command.run(() => extensionService.upgrade(name));
    });

  ext
    .command("create <name>")
    .description("Scaffold a new extension project.")
    .action(async (name: string) => {
      await command.run(() => extensionService.create(name));
    });

  ext
    .command("exec <name>")
    .description("Run an installed extension.")
    .argument("[args...]", "Arguments to pass to the extension")
    .action(async (name: string, args: string[] = []) => {
      await command.run(() => extensionService.exec(name, args));
    });
};

export default { register };
