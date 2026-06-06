import pc from "picocolors";

import api from "@/api/insights";
import dates from "@/core/dates";
import output from "@/core/output";
import spinner from "@/core/spinner";

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
  return spinner.withSpinner(
    `Fetching traffic data for ${pc.cyan(repo)}...`,
    async () => {
      const [views, clones] = await Promise.all([
        api.getTrafficViews(repo),
        api.getTrafficClones(repo),
      ]);

      return {
        views: { count: views.count, uniques: views.uniques },
        clones: { count: clones.count, uniques: clones.uniques },
      };
    },
    "Traffic data fetched.",
  );
};

const contributors = async (repo: string): Promise<ContributorSummary[]> => {
  return spinner.withSpinner(
    `Fetching contributors for ${pc.cyan(repo)}...`,
    async () => {
      const data = await api.getContributors(repo);

      return data.map((c) => ({
        login: c.login,
        contributions: c.contributions,
      }));
    },
    "Contributors fetched.",
  );
};

const commits = async (repo: string): Promise<CommitSummary> => {
  return spinner.withSpinner(
    `Fetching commit activity for ${pc.cyan(repo)}...`,
    async () => {
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
    },
    "Commit activity fetched.",
  );
};

const codeFrequency = async (repo: string): Promise<CodeFrequencySummary> => {
  return spinner.withSpinner(
    `Fetching code frequency for ${pc.cyan(repo)}...`,
    async () => {
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
    },
    "Code frequency fetched.",
  );
};

const popularity = async (
  repo: string,
): Promise<{
  referrers: ReferrerSummary[];
  paths: PathSummary[];
}> => {
  return spinner.withSpinner(
    `Fetching popularity metrics for ${pc.cyan(repo)}...`,
    async () => {
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
    },
    "Popularity metrics fetched.",
  );
};

const participation = async (
  repo: string,
): Promise<{
  allTime: number[];
  ownerTime: number[];
}> => {
  return spinner.withSpinner(
    `Fetching participation stats for ${pc.cyan(repo)}...`,
    async () => {
      const data = await api.getParticipation(repo);
      return {
        allTime: data.all,
        ownerTime: data.owner,
      };
    },
    "Participation stats fetched.",
  );
};

const formatTraffic = (data: TrafficSummary) => {
  output.renderSection("Traffic (Last 14 days)");
  output.renderTable([
    {
      Metric: "Views",
      Total: pc.yellow(data.views.count.toLocaleString()),
      Unique: pc.dim(data.views.uniques.toLocaleString()),
    },
    {
      Metric: "Clones",
      Total: pc.yellow(data.clones.count.toLocaleString()),
      Unique: pc.dim(data.clones.uniques.toLocaleString()),
    },
  ]);
};

const formatContributors = (data: ContributorSummary[]) => {
  output.renderSection("Top Contributors");

  output.renderTable(
    data.slice(0, 10).map((c) => ({
      Login: pc.cyan(c.login),
      Contributions: pc.yellow(c.contributions.toLocaleString()),
    })),

    { emptyMessage: "No contributors found." },
  );
};

const formatCommits = (data: CommitSummary) => {
  output.renderSection("Commit Activity");
  output.renderTable([
    {
      Metric: "Total Weeks",
      Value: pc.yellow(data.totalWeeks.toString()),
    },

    {
      Metric: "Average/Week",
      Value: pc.yellow(data.averagePerWeek.toString()),
    },

    {
      Metric: "Most Active Week",

      Value: data.mostActiveWeek
        ? `${pc.cyan(dates.formatRelative(data.mostActiveWeek.week))} (${pc.yellow(data.mostActiveWeek.commits)} commits)`
        : pc.dim("n/a"),
    },
  ]);
};

const formatCodeFrequency = (data: CodeFrequencySummary) => {
  output.renderSection("Code Frequency");
  output.renderTable([
    {
      Metric: "Additions",
      Value: pc.green(`+${data.additions.toLocaleString()}`),
    },

    {
      Metric: "Deletions",
      Value: pc.red(`-${data.deletions.toLocaleString()}`),
    },

    {
      Metric: "Net",

      Value:
        data.net >= 0
          ? pc.green(`+${data.net.toLocaleString()}`)
          : pc.red(data.net.toLocaleString()),
    },
  ]);
};

const formatPopularity = (data: {
  referrers: ReferrerSummary[];
  paths: PathSummary[];
}) => {
  if (data.referrers.length > 0) {
    output.renderSection("Top Referrers");

    output.renderTable(
      data.referrers.slice(0, 5).map((r) => ({
        Referrer: pc.cyan(r.referrer),
        Views: pc.yellow(r.count.toLocaleString()),
        Unique: pc.dim(r.uniques.toLocaleString()),
      })),
    );
  }

  if (data.paths.length > 0) {
    output.renderSection("Popular Paths");

    output.renderTable(
      data.paths.slice(0, 5).map((p) => ({
        Path: pc.cyan(p.path),
        Views: pc.yellow(p.count.toLocaleString()),
        Unique: pc.dim(p.uniques.toLocaleString()),
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
