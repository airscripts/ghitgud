import { Command } from "commander";

import config from "@/core/config";
import output from "@/core/output";
import prompt from "@/core/prompt";
import command from "@/core/command";
import { ConfigError } from "@/core/errors";
import { ERROR_NO_REPO } from "@/core/constants";

import insightsService from "@/services/insights";

const register = (program: Command) => {
  const insights = program
    .command("insights")
    .description("Repository insights and analytics.");

  insights.addHelpText(
    "after",
    `
Examples:
  ghitgud insights traffic --repo owner/repo
  ghitgud insights contributors
  ghitgud insights popularity
`,
  );

  insights
    .command("traffic")
    .description(
      "View traffic data (views, clones). Requires token with repo scope.",
    )
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(async () => {
        const repo = await prompt.promptIfMissing(
          options.repo || config.getRepoOptional(),
          "Enter repository (owner/repo):",
          { placeholder: "owner/repo" },
        );

        if (!repo) throw new ConfigError(ERROR_NO_REPO);
        const data = await insightsService.traffic(repo);
        insightsService.formatTraffic(data);

        return { success: true, repo, metadata: data };
      });
    });

  insights
    .command("contributors")
    .description("List top contributors.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(async () => {
        const repo = await prompt.promptIfMissing(
          options.repo || config.getRepoOptional(),
          "Enter repository (owner/repo):",
          { placeholder: "owner/repo" },
        );

        if (!repo) throw new ConfigError(ERROR_NO_REPO);
        const data = await insightsService.contributors(repo);
        insightsService.formatContributors(data);

        return { success: true, repo, metadata: data };
      });
    });

  insights
    .command("commits")
    .description("Commit activity and statistics.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(async () => {
        const repo = await prompt.promptIfMissing(
          options.repo || config.getRepoOptional(),
          "Enter repository (owner/repo):",
          { placeholder: "owner/repo" },
        );

        if (!repo) throw new ConfigError(ERROR_NO_REPO);
        const data = await insightsService.commits(repo);
        insightsService.formatCommits(data);

        return { success: true, repo, metadata: data };
      });
    });

  insights
    .command("frequency")
    .description("Code frequency (additions/deletions).")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(async () => {
        const repo = await prompt.promptIfMissing(
          options.repo || config.getRepoOptional(),
          "Enter repository (owner/repo):",
          { placeholder: "owner/repo" },
        );

        if (!repo) throw new ConfigError(ERROR_NO_REPO);
        const data = await insightsService.codeFrequency(repo);
        insightsService.formatCodeFrequency(data);

        return { success: true, repo, metadata: data };
      });
    });

  insights
    .command("popularity")
    .description("Popular referrers and paths. Requires token with repo scope.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(async () => {
        const repo = await prompt.promptIfMissing(
          options.repo || config.getRepoOptional(),
          "Enter repository (owner/repo):",
          { placeholder: "owner/repo" },
        );

        if (!repo) throw new ConfigError(ERROR_NO_REPO);
        const data = await insightsService.popularity(repo);
        insightsService.formatPopularity(data);

        return { success: true, repo, metadata: data };
      });
    });

  insights
    .command("participation")
    .description("Weekly commit participation (all vs owner).")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(async () => {
        const repo = await prompt.promptIfMissing(
          options.repo || config.getRepoOptional(),
          "Enter repository (owner/repo):",
          { placeholder: "owner/repo" },
        );

        if (!repo) throw new ConfigError(ERROR_NO_REPO);
        const data = await insightsService.participation(repo);

        output.renderSection("Participation");
        output.renderKeyValues([
          ["All commits", data.allTime.join(", ")],
          ["Owner commits", data.ownerTime.join(", ")],
        ]);

        return { success: true, repo, metadata: data };
      });
    });
};

export default { register };
