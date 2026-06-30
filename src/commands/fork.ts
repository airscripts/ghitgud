import { Command } from "commander";

import command from "@/core/command";
import forkService from "@/services/fork";

const register = (program: Command) => {
  const fork = program.command("fork").description("Manage repository forks.");

  fork
    .command("sync")
    .description("Fast-forward a fork from its upstream.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--branch <branch>", "Branch to sync (default: repository default)")
    .action(async (options: { repo?: string; branch?: string }) => {
      await command.run(() => forkService.sync(options));
    });

  fork
    .command("compare")
    .description("Show ahead/behind status against upstream.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--upstream <upstream>", "Upstream repository (owner/repo)")
    .option(
      "--branch <branch>",
      "Branch to compare (default: repository default)",
    )
    .action(
      async (options: {
        repo?: string;
        upstream?: string;
        branch?: string;
      }) => {
        await command.run(() => forkService.compare(options));
      },
    );

  fork
    .command("list")
    .description("List forks of a repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      await command.run(() => forkService.list(options));
    });

  fork
    .command("create <repo>")
    .description("Create a fork of a repository.")
    .option("--org <org>", "Organization to fork into")
    .option("--clone", "Clone the fork locally after creation", false)
    .action(
      async (repo: string, options: { org?: string; clone?: boolean }) => {
        await command.run(() =>
          forkService.create({ repo, org: options.org, clone: options.clone }),
        );
      },
    );
};

export default { register };
