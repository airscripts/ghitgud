import { Command } from "commander";

import output from "@/core/output";
import command from "@/core/command";
import repoResolver from "@/core/repo";

import insightsService from "@/services/insights";

const register = (program: Command) => {
  const insights = program
    .command("insights")
    .description("Repository insights and analytics.");

  insights.addHelpText(
    "after",
    `
Examples:
  ghg insights traffic --repo owner/repo
  ghg insights contributors
  ghg insights popularity
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
        const repo = await repoResolver.resolveRepo(options.repo);

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
        const repo = await repoResolver.resolveRepo(options.repo);

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
        const repo = await repoResolver.resolveRepo(options.repo);

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
        const repo = await repoResolver.resolveRepo(options.repo);

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
        const repo = await repoResolver.resolveRepo(options.repo);

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
        const repo = await repoResolver.resolveRepo(options.repo);

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
