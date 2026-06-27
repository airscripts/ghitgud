import fs from "fs";
import api from "@/api/repos";
import output from "@/core/output";
import logger from "@/core/logger";
import progress from "@/core/progress";
import repoResolver from "@/core/repo";
import { GhitgudError } from "@/core/errors";

import {
  ENCODING,
  ERROR_NO_REPO_TARGET,
  ERROR_MUTATION_REQUIRES_YES,
  DEFAULT_REPOS_REPORT_SINCE_DAYS,
} from "@/core/constants";

import {
  RepoSummary,
  BulkRepoResult,
  BulkRepoMetadata,
  RepoTargetOptions,
} from "@/types";

function normalizeRepoName(fullName: string): string {
  const parts = fullName
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 2) {
    throw new GhitgudError(`Invalid repository name: ${fullName}.`);
  }

  return `${parts[0]}/${parts[1]}`;
}

function parseLimit(limit?: number | string): number | undefined {
  if (limit === undefined) return undefined;
  const value = Number(limit);

  if (Number.isNaN(value) || value <= 0) {
    throw new GhitgudError(`Invalid limit: ${limit}.`);
  }

  return value;
}

function toRepoSummary(fullName: string): RepoSummary {
  const normalized = normalizeRepoName(fullName);
  const [, name] = normalized.split("/");

  return {
    id: 0,
    name,
    fork: false,
    private: false,
    pushedAt: null,
    archived: false,
    fullName: normalized,
    defaultBranch: "main",
  };
}

function dedupeRepos(repos: RepoSummary[]): RepoSummary[] {
  const seen = new Set<string>();

  return repos.filter((repo) => {
    const key = repo.fullName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readReposFromFile(filePath: string): RepoSummary[] {
  const data = fs.readFileSync(filePath, ENCODING).trim();
  if (!data) return [];

  try {
    const parsed = JSON.parse(data) as string[] | { repos?: string[] };
    const repos = Array.isArray(parsed) ? parsed : (parsed.repos ?? []);

    return repos.map(toRepoSummary);
  } catch {
    return data
      .split(/\r?\n/)
      .map((repo) => repo.trim())
      .filter(Boolean)
      .map(toRepoSummary);
  }
}

const parseReposInput = (input: string): RepoSummary[] => {
  return input
    .split(",")
    .map((repo) => repo.trim())
    .filter(Boolean)
    .map(toRepoSummary);
};

const resolveRepos = async (
  options: RepoTargetOptions,
): Promise<RepoSummary[]> => {
  if (options.repos) return parseReposInput(options.repos);
  if (options.file) return readReposFromFile(options.file);
  if (options.org) return await api.fetchOrg(options.org);
  if (options.user) return await api.fetchUser(options.user);
  const repo = await repoResolver.resolveRepo();
  return [toRepoSummary(repo)];
};

const resolveTargets = async (
  options: RepoTargetOptions = {},
): Promise<RepoSummary[]> => {
  const limit = parseLimit(options.limit);
  const repos = await resolveRepos(options);

  if (!repos.length) {
    throw new GhitgudError(ERROR_NO_REPO_TARGET);
  }

  const uniqueRepos = dedupeRepos(repos);
  return limit ? uniqueRepos.slice(0, limit) : uniqueRepos;
};

const requireMutationConfirmation = (dryRun?: boolean, yes?: boolean) => {
  if (!dryRun && !yes) {
    throw new GhitgudError(ERROR_MUTATION_REQUIRES_YES);
  }
};

const parsePeriod = (period?: string): Date => {
  if (!period) {
    const date = new Date();
    date.setDate(date.getDate() - DEFAULT_REPOS_REPORT_SINCE_DAYS);
    return date;
  }

  const match = period.match(/^(\d+)([dwm])$/);
  if (!match) {
    throw new GhitgudError(`Invalid period: ${period}.`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const date = new Date();

  if (unit === "d") date.setDate(date.getDate() - value);
  if (unit === "w") date.setDate(date.getDate() - value * 7);
  if (unit === "m") date.setMonth(date.getMonth() - value);

  return date;
};

const parseMonths = (months?: number | string, fallback = 12): number => {
  if (months === undefined) return fallback;
  const value = Number(months);

  if (Number.isNaN(value) || value <= 0) {
    throw new GhitgudError(`Invalid months value: ${months}.`);
  }

  return value;
};

const getInactiveMonths = (pushedAt: string | null): number => {
  if (!pushedAt) return Number.MAX_SAFE_INTEGER;

  const diff = Date.now() - new Date(pushedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
};

const runBulk = async <T>(
  repos: RepoSummary[],
  handler: (repo: RepoSummary) => Promise<T>,
): Promise<{ success: boolean; metadata: BulkRepoMetadata<T> }> => {
  const { results, errors } = await progress.withProgress(
    repos,
    "Processing repositories",
    async (repo) => {
      const metadata = await handler(repo);
      return {
        metadata,
        success: true,
        repo: repo.fullName,
      } as BulkRepoResult<T>;
    },
  );

  const mappedResults: BulkRepoResult<T>[] = [];
  for (let i = 0; i < repos.length; i++) {
    const result = results[i];
    const error = errors[i];

    if (result) {
      mappedResults.push(result);
    } else if (error) {
      mappedResults.push({
        success: false,
        error: error.error,
        repo: repos[i].fullName,
      } as BulkRepoResult<T>);
    }
  }

  const failed = mappedResults.filter((result) => !result.success).length;
  const completed = mappedResults.length - failed;

  return {
    success: failed === 0,
    metadata: {
      failed,
      completed,
      results: mappedResults,
    },
  };
};

const renderBulkResults = <T>(
  title: string,
  result: { success: boolean; metadata: BulkRepoMetadata<T> },
  mapSuccess: (repo: string, metadata: T) => Record<string, unknown>,
) => {
  const rows = result.metadata.results.map((item) => {
    if (!item.success) {
      return {
        repo: item.repo,
        status: "failed",
        error: item.error ?? "Unknown error",
      };
    }

    return {
      repo: item.repo,
      status: "ok",
      ...mapSuccess(item.repo, item.metadata as T),
    };
  });

  output.renderTable(rows, { emptyMessage: "No repository results found." });
  output.renderSummary(title, [
    ["Completed", result.metadata.completed],
    ["Failed", result.metadata.failed],
    ["Total", result.metadata.results.length],
  ]);

  if (result.metadata.failed > 0) {
    logger.warn(`${result.metadata.failed} repository operation(s) failed.`);
  } else {
    logger.success("All repository operations completed successfully.");
  }
};

export default {
  runBulk,
  parseMonths,
  parsePeriod,
  resolveTargets,
  renderBulkResults,
  getInactiveMonths,
  requireMutationConfirmation,
};
