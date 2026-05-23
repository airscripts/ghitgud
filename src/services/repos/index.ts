import fs from "fs";
import api from "@/api/repos";
import config from "@/core/config";
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
  return [toRepoSummary(config.getRepo())];
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

const getErrorMessage = (reason: unknown): string => {
  return reason instanceof Error ? reason.message : String(reason);
};

const runBulk = async <T>(
  repos: RepoSummary[],
  handler: (repo: RepoSummary) => Promise<T>,
): Promise<{ success: boolean; metadata: BulkRepoMetadata<T> }> => {
  const settled = await Promise.allSettled(
    repos.map(async (repo) => {
      const metadata = await handler(repo);

      return {
        repo: repo.fullName,
        success: true,
        metadata,
      } as BulkRepoResult<T>;
    }),
  );

  const results = settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;

    return {
      repo: repos[index].fullName,
      success: false,
      error: getErrorMessage(result.reason),
    } as BulkRepoResult<T>;
  });

  const failed = results.filter((result) => !result.success).length;
  const completed = results.length - failed;

  return {
    success: failed === 0,
    metadata: {
      completed,
      failed,
      results,
    },
  };
};

export default {
  getInactiveMonths,
  parseMonths,
  parsePeriod,
  requireMutationConfirmation,
  resolveTargets,
  runBulk,
};
