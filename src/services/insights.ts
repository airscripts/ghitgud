import api from "@/api/insights";
import logger from "@/core/logger";

interface TrafficSummary {
  views: { count: number; uniques: number };
  clones: { count: number; uniques: number };
}

interface ContributorSummary {
  login: string;
  contributions: number;
}

interface CommitSummary {
  totalWeeks: number;
  averagePerWeek: number;
  mostActiveWeek: { week: string; commits: number } | null;
}

interface CodeFrequencySummary {
  net: number;
  additions: number;
  deletions: number;
}

interface ReferrerSummary {
  count: number;
  uniques: number;
  referrer: string;
}

interface PathSummary {
  path: string;
  title: string;
  count: number;
  uniques: number;
}

const traffic = async (repo: string): Promise<TrafficSummary> => {
  logger.info(`Fetching traffic data for ${repo}.`);

  const [views, clones] = await Promise.all([
    api.getTrafficViews(repo),
    api.getTrafficClones(repo),
  ]);

  return {
    views: { count: views.count, uniques: views.uniques },
    clones: { count: clones.count, uniques: clones.uniques },
  };
};

const contributors = async (repo: string): Promise<ContributorSummary[]> => {
  logger.info(`Fetching contributors for ${repo}.`);

  const data = await api.getContributors(repo);
  return data.map((c) => ({
    login: c.login,
    contributions: c.contributions,
  }));
};

const commits = async (repo: string): Promise<CommitSummary> => {
  logger.info(`Fetching commit activity for ${repo}.`);

  const data = await api.getCommitActivity(repo);
  if (!data.length) {
    return { totalWeeks: 0, averagePerWeek: 0, mostActiveWeek: null };
  }

  const totalCommits = data.reduce((sum, week) => sum + week.total, 0);
  const mostActive = data.reduce((max, week) =>
    week.total > max.total ? week : max,
  );

  return {
    totalWeeks: data.length,
    averagePerWeek: Math.round(totalCommits / data.length),
    mostActiveWeek: {
      commits: mostActive.total,
      week: new Date(mostActive.week * 1000).toISOString().split("T")[0],
    },
  };
};

const codeFrequency = async (repo: string): Promise<CodeFrequencySummary> => {
  logger.info(`Fetching code frequency for ${repo}.`);
  const data = await api.getCodeFrequency(repo);

  if (!data.length) {
    return { additions: 0, deletions: 0, net: 0 };
  }

  const additions = data.reduce((sum, [, add]) => sum + add, 0);
  const deletions = data.reduce((sum, [, , del]) => sum + Math.abs(del), 0);

  return {
    additions,
    deletions,
    net: additions - deletions,
  };
};

const popularity = async (
  repo: string,
): Promise<{
  referrers: ReferrerSummary[];
  paths: PathSummary[];
}> => {
  logger.info(`Fetching popularity metrics for ${repo}.`);

  const [referrers, paths] = await Promise.all([
    api.getReferrers(repo),
    api.getPopularPaths(repo),
  ]);

  return {
    referrers: referrers.map((r) => ({
      referrer: r.referrer,
      count: r.count,
      uniques: r.uniques,
    })),
    paths: paths.map((p) => ({
      path: p.path,
      title: p.title,
      count: p.count,
      uniques: p.uniques,
    })),
  };
};

const participation = async (
  repo: string,
): Promise<{
  allTime: number[];
  ownerTime: number[];
}> => {
  logger.info(`Fetching participation stats for ${repo}.`);

  const data = await api.getParticipation(repo);
  return {
    allTime: data.all,
    ownerTime: data.owner,
  };
};

const formatTraffic = (data: TrafficSummary) => {
  logger.info("");
  logger.info("Traffic (Last 14 days)");
  logger.info("=".repeat(50));

  logger.info(
    `Views:    ${data.views.count.toLocaleString()} total (${data.views.uniques.toLocaleString()} unique)`,
  );

  logger.info(
    `Clones:   ${data.clones.count.toLocaleString()} total (${data.clones.uniques.toLocaleString()} unique)`,
  );
};

const formatContributors = (data: ContributorSummary[]) => {
  logger.info("");
  logger.info("Top Contributors");
  logger.info("=".repeat(50));

  console.table(
    data.slice(0, 10).map((c) => ({
      Login: c.login,
      Contributions: c.contributions.toLocaleString(),
    })),
  );
};

const formatCommits = (data: CommitSummary) => {
  logger.info("");
  logger.info("Commit Activity");
  logger.info("=".repeat(50));
  logger.info(`Total Weeks:      ${data.totalWeeks}`);
  logger.info(`Average/Week:     ${data.averagePerWeek}`);

  if (data.mostActiveWeek) {
    logger.info(
      `Most Active Week: ${data.mostActiveWeek.week} (${data.mostActiveWeek.commits} commits)`,
    );
  }
};

const formatCodeFrequency = (data: CodeFrequencySummary) => {
  logger.info("");
  logger.info("Code Frequency");
  logger.info("=".repeat(50));
  logger.info(`Additions:  +${data.additions.toLocaleString()}`);
  logger.info(`Deletions:  -${data.deletions.toLocaleString()}`);

  logger.info(
    `Net:        ${data.net > 0 ? "+" : ""}${data.net.toLocaleString()}`,
  );
};

const formatPopularity = (data: {
  referrers: ReferrerSummary[];
  paths: PathSummary[];
}) => {
  if (data.referrers.length > 0) {
    logger.info("");
    logger.info("Top Referrers");
    logger.info("=".repeat(50));

    console.table(
      data.referrers.slice(0, 5).map((r) => ({
        Referrer: r.referrer,
        Views: r.count.toLocaleString(),
        Unique: r.uniques.toLocaleString(),
      })),
    );
  }

  if (data.paths.length > 0) {
    logger.info("");
    logger.info("Popular Paths");
    logger.info("=".repeat(50));

    console.table(
      data.paths.slice(0, 5).map((p) => ({
        Path: p.path,
        Views: p.count.toLocaleString(),
        Unique: p.uniques.toLocaleString(),
      })),
    );
  }
};

export default {
  traffic,
  commits,
  popularity,
  contributors,
  codeFrequency,
  participation,
  formatTraffic,
  formatCommits,
  formatPopularity,
  formatContributors,
  formatCodeFrequency,
};
