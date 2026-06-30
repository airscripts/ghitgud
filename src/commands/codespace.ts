import { Command } from "commander";

import command from "@/core/command";
import codespaceService from "@/services/codespace";

const register = (program: Command) => {
  const codespace = program
    .command("codespace")
    .description("Manage GitHub Codespaces.");

  codespace
    .command("list")
    .description("List your codespaces.")
    .action(async () => {
      await command.run(() => codespaceService.list());
    });

  codespace
    .command("view <id>")
    .description("View codespace details.")
    .action(async (id: string) => {
      await command.run(() => codespaceService.view(id));
    });

  codespace
    .command("create")
    .description("Create a codespace.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--ref <branch>", "Branch or ref to open")
    .option("--machine <machine>", "Machine type")
    .option("--idle-timeout <minutes>", "Idle timeout in minutes", parseInt)
    .action(async (options) => {
      await command.run(() =>
        codespaceService.create({
          repo: options.repo,
          ref: options.ref,
          machine: options.machine,
          idleTimeout: options.idleTimeout,
        }),
      );
    });

  codespace
    .command("start <id>")
    .description("Start a stopped codespace.")
    .action(async (id: string) => {
      await command.run(() => codespaceService.start(id));
    });

  codespace
    .command("stop <id>")
    .description("Stop a running codespace.")
    .action(async (id: string) => {
      await command.run(() => codespaceService.stop(id));
    });

  codespace
    .command("delete <id>")
    .description("Delete a codespace.")
    .option("--yes", "Confirm deletion")
    .action(async (id: string, options: { yes?: boolean }) => {
      await command.run(() =>
        codespaceService.delete(id, { yes: options.yes }),
      );
    });
};

export default { register };
