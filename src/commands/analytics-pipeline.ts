import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import costService from "@/services/cost";
import { commandGroup } from "@/operations/groups";

const register = (program: Command) => {
  const actions = commandGroup(
    program,
    "analytics",
    "Inspect repository and pipeline analytics.",
  )
    .command("pipeline")
    .description("Actions cost and usage analytics.");

  actions
    .command("usage")
    .description("Show Actions usage for a repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--period <period>", "Time period (30d, 90d, current-month)", "30d")
    .action(async (options: { repo?: string; period?: string }) => {
      await command.run(() => costService.usage({ repo: options.repo }));
    });

  actions
    .command("cost")
    .description("Show Actions cost breakdown.")
    .option("--org <org>", "Organization")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { org?: string; repo?: string }) => {
      await command.run(() =>
        costService.cost({ org: options.org, repo: options.repo }),
      );
    });

  actions
    .command("top-spenders")
    .description("Show top workflows by cost.")
    .option("--org <org>", "Organization")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--limit <n>", "Number of results", "10")
    .action(async (options: { org?: string; repo?: string; limit: string }) => {
      await command.run(() =>
        costService.topSpenders({
          org: options.org,
          repo: options.repo,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  actions
    .command("export")
    .description("Export Actions usage data.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--format <format>", "Export format (json or csv)", "json")
    .action(async (options: { repo?: string; format?: string }) => {
      await command.run(() =>
        costService.exportUsage({ repo: options.repo, format: options.format }),
      );
    });
};

export default { register };
