import { Command } from "commander";

import command from "@/core/command";
import workspaceService from "@/services/workspace";

const collect = (value: string, previous: string[]): string[] => [
  ...previous,
  value,
];

const register = (program: Command) => {
  const workspace = program
    .command("workspace")
    .description("Manage named workspaces for multi-repo operations.");

  workspace
    .command("define")
    .description("Define or update a named workspace.")
    .requiredOption("--name <name>", "Workspace name")
    .requiredOption("--repos <repo>", "Repository (repeatable)", collect, [])
    .action(async (options: { name: string; repos: string[] }) => {
      await command.run(() =>
        workspaceService.define(options.name, options.repos),
      );
    });

  workspace
    .command("list")
    .description("List all workspaces.")
    .action(async () => {
      await command.run(() => workspaceService.list());
    });

  workspace
    .command("run")
    .description("Run a command across all repos in a workspace.")
    .requiredOption("--name <name>", "Workspace name")
    .requiredOption("--command <cmd>", "Command to run")
    .action(async (options: { name: string; command: string }) => {
      await command.run(() =>
        workspaceService.run(options.name, options.command),
      );
    });
};

export default { register };
