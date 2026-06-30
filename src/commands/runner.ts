import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import runnerService from "@/services/runner";

const register = (program: Command) => {
  const runner = program
    .command("runner")
    .description("Manage self-hosted runners.");

  runner
    .command("list")
    .description("List self-hosted runners.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--org <org>", "Organization login")
    .option("--label <label>", "Filter by runner label")
    .action(async (options) => {
      await command.run(() =>
        runnerService.list({
          repo: options.repo,
          org: options.org,
          label: options.label,
        }),
      );
    });

  runner
    .command("view <id>")
    .description("View runner details.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--org <org>", "Organization login")
    .action(async (id: string, options) => {
      await command.run(() =>
        runnerService.view(parse.parsePositiveInt(id, "runner id"), {
          repo: options.repo,
          org: options.org,
        }),
      );
    });

  runner
    .command("status <id>")
    .description("Show runner health and busy status.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--org <org>", "Organization login")
    .action(async (id: string, options) => {
      await command.run(() =>
        runnerService.status(parse.parsePositiveInt(id, "runner id"), {
          repo: options.repo,
          org: options.org,
        }),
      );
    });

  runner
    .command("remove <id>")
    .description("Remove a self-hosted runner.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--org <org>", "Organization login")
    .option("--yes", "Confirm removal")
    .action(async (id: string, options) => {
      await command.run(() =>
        runnerService.remove(parse.parsePositiveInt(id, "runner id"), {
          repo: options.repo,
          org: options.org,
          yes: options.yes,
        }),
      );
    });

  runner
    .command("labels <id>")
    .description("List labels for a runner.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--org <org>", "Organization login")
    .action(async (id: string, options) => {
      await command.run(() =>
        runnerService.labels(parse.parsePositiveInt(id, "runner id"), {
          repo: options.repo,
          org: options.org,
        }),
      );
    });
};

export default { register };
