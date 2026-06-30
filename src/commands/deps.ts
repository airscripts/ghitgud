import { Command } from "commander";

import command from "@/core/command";
import depsService from "@/services/deps";

const register = (program: Command) => {
  const deps = program
    .command("deps")
    .description("View dependency graph and review changes.");

  deps
    .command("list")
    .description("List dependencies for a repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      await command.run(() => depsService.list({ repo: options.repo }));
    });

  deps
    .command("direct")
    .description("List direct dependencies only.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      await command.run(() => depsService.direct({ repo: options.repo }));
    });

  deps
    .command("review")
    .description("Compare dependencies between two refs.")
    .requiredOption("--base <ref>", "Base ref (branch, SHA, or tag)")
    .requiredOption("--head <ref>", "Head ref (branch, SHA, or tag)")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string; base: string; head: string }) => {
      await command.run(() =>
        depsService.review({
          repo: options.repo,
          base: options.base,
          head: options.head,
        }),
      );
    });
};

export default { register };
