import git from "@/core/git";
import logger from "@/core/logger";
import { ConfigError } from "@/core/errors";
import { ERROR_NO_REPO } from "@/core/constants";

const REPO_PATTERN = /^[^/\s]+\/[^/\s]+$/;

function normalizeRepo(repo: string): string {
  const normalized = repo.trim().replace(/^https:\/\/github\.com\//, "");
  const withoutSuffix = normalized.replace(/\.git$/, "");

  if (!REPO_PATTERN.test(withoutSuffix)) {
    throw new ConfigError(
      `Invalid repository "${repo}". Expected owner/repo format.`,
    );
  }

  return withoutSuffix;
}

function inferFromGitRemote(): string | null {
  try {
    const remoteUrl = git.getRemoteUrl();
    const parsed = git.parseRepoFromRemoteUrl(remoteUrl);

    if (parsed) {
      const repo = normalizeRepo(parsed);
      logger.debug?.(`Inferred repo from git remote: ${repo}`);
      return repo;
    }
  } catch {
    // Not inside a git repo or no remote.
  }

  return null;
}

function resolveRepoSync(preferred?: string): string {
  if (preferred) return normalizeRepo(preferred);

  const inferred = inferFromGitRemote();
  if (inferred) return inferred;

  throw new ConfigError(ERROR_NO_REPO);
}

async function resolveRepo(preferred?: string): Promise<string> {
  if (preferred) {
    const repo = normalizeRepo(preferred);
    logger.debug?.(`Using explicit repo: ${repo}`);
    return repo;
  }

  const inferred = inferFromGitRemote();
  if (inferred) return inferred;

  throw new ConfigError(ERROR_NO_REPO);
}

async function resolveRepos(preferredList?: string): Promise<string[]> {
  if (preferredList) {
    return preferredList.split(",").map(normalizeRepo);
  }

  const repo = await resolveRepo();
  return [repo];
}

export default {
  resolveRepo,
  resolveRepos,
  resolveRepoSync,
};
