import service from "./index";
import pulls from "@/api/pulls";
import issues from "@/api/issues";
import logger from "@/core/logger";
import commits from "@/api/commits";
import { RepoTargetOptions } from "@/types";

interface ReportOptions extends RepoTargetOptions {
  since?: string;
}

interface ReportResult {
  fork: boolean;
  private: boolean;
  archived: boolean;
  openIssues: number;
  staleIssues: number;
  contributors: number;
  openPullRequests: number;
  averageMergeHours: number;
  mergedPullRequests: number;
  lastPushedAt: string | null;
}

const MS_PER_HOUR = 1000 * 60 * 60;

const getMergeDuration = (pull: {
  created_at: string;
  merged_at: string | null;
}): number => {
  const created = new Date(pull.created_at).getTime();
  const merged = new Date(pull.merged_at as string).getTime();
  return (merged - created) / MS_PER_HOUR;
};

const average = (values: number[]): number => {
  if (!values.length) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round(sum / values.length);
};

const report = async (options: ReportOptions = {}) => {
  logger.info("Generating repository report.");
  const since = service.parsePeriod(options.since).toISOString();
  const staleDate = since.split("T")[0];
  const repos = await service.resolveTargets(options);

  return service.runBulk<ReportResult>(repos, async (repo) => {
    const [
      openIssues,
      staleIssues,
      openPullRequests,
      mergedPullRequests,
      contributors,
    ] = await Promise.all([
      issues.countOpen(repo.fullName),
      issues.countStale(repo.fullName, staleDate),
      pulls.countOpen(repo.fullName),
      pulls.listMergedSince(repo.fullName, since),
      commits.contributors(repo.fullName),
    ]);

    const mergeDurations = mergedPullRequests.map(getMergeDuration);
    const averageMergeHours = average(mergeDurations);

    return {
      openIssues,
      staleIssues,
      fork: repo.fork,
      openPullRequests,
      averageMergeHours,
      private: repo.private,
      archived: repo.archived,
      lastPushedAt: repo.pushedAt,
      contributors: contributors.length,
      mergedPullRequests: mergedPullRequests.length,
    };
  });
};

export default { report };
