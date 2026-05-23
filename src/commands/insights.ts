import logger from "@/core/logger";
import config from "@/core/config";
import { Command } from "commander";
import { ConfigError } from "@/core/errors";
import { ERROR_NO_REPO } from "@/core/constants";
import insightsService from "@/services/insights";

const register = (program: Command) => {
  const insights = program
    .command("insights")
    .description("Repository insights and analytics.");

  insights
    .command("traffic")
    .description(
      "View traffic data (views, clones). Requires token with repo scope.",
    )
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = options.repo || config.getRepoOptional();
      if (!repo) throw new ConfigError(ERROR_NO_REPO);

      const data = await insightsService.traffic(repo);
      insightsService.formatTraffic(data);
    });

  insights
    .command("contributors")
    .description("List top contributors.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = options.repo || config.getRepoOptional();
      if (!repo) throw new ConfigError(ERROR_NO_REPO);

      const data = await insightsService.contributors(repo);
      insightsService.formatContributors(data);
    });

  insights
    .command("commits")
    .description("Commit activity and statistics.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = options.repo || config.getRepoOptional();
      if (!repo) throw new ConfigError(ERROR_NO_REPO);

      const data = await insightsService.commits(repo);
      insightsService.formatCommits(data);
    });

  insights
    .command("frequency")
    .description("Code frequency (additions/deletions).")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = options.repo || config.getRepoOptional();
      if (!repo) throw new ConfigError(ERROR_NO_REPO);

      const data = await insightsService.codeFrequency(repo);
      insightsService.formatCodeFrequency(data);
    });

  insights
    .command("popularity")
    .description("Popular referrers and paths. Requires token with repo scope.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = options.repo || config.getRepoOptional();
      if (!repo) throw new ConfigError(ERROR_NO_REPO);

      const data = await insightsService.popularity(repo);
      insightsService.formatPopularity(data);
    });

  insights
    .command("participation")
    .description("Weekly commit participation (all vs owner).")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = options.repo || config.getRepoOptional();
      if (!repo) throw new ConfigError(ERROR_NO_REPO);

      const data = await insightsService.participation(repo);
      logger.info(`All commits: ${data.allTime.join(", ")}`);
      logger.info(`Owner commits: ${data.ownerTime.join(", ")}`);
    });
};

export default { register };
