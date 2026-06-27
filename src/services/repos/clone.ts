import { execSync } from "child_process";

import service from "./index";
import output from "@/core/output";
import { RepoTargetOptions } from "@/types";
import { GhitgudError } from "@/core/errors";

interface CloneOptions extends RepoTargetOptions {
  dryRun?: boolean;
  includeForks?: boolean;
  includePrivate?: boolean;
  protocol?: "https" | "ssh";
}

interface CloneResult {
  repo: string;
  action: string;
  path: string;
}

const buildCloneUrl = (
  repo: { fullName: string },
  protocol: "https" | "ssh",
): string => {
  if (protocol === "ssh") {
    return `git@github.com:${repo.fullName}.git`;
  }

  return `https://github.com/${repo.fullName}.git`;
};

const isRepoCloned = (name: string): boolean => {
  try {
    execSync(`test -d ${name}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
};

const clone = async (options: CloneOptions) => {
  output.log(
    options.dryRun
      ? "Previewing repository clone targets."
      : "Cloning repositories.",
  );

  const protocol = options.protocol ?? "https";
  const repos = await service.resolveTargets(options);

  const filtered = repos.filter((repo) => {
    if (repo.fork && !options.includeForks) return false;
    if (repo.private && !options.includePrivate) return false;
    return true;
  });

  const result = await service.runBulk<CloneResult>(filtered, async (repo) => {
    const cloneUrl = buildCloneUrl(repo, protocol);

    if (isRepoCloned(repo.name)) {
      return {
        path: repo.name,
        repo: repo.fullName,
        action: "skipped_exists",
      };
    }

    if (options.dryRun) {
      return {
        path: repo.name,
        repo: repo.fullName,
        action: "would_clone",
      };
    }

    try {
      execSync(`git clone ${cloneUrl}`, { stdio: "pipe" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new GhitgudError(`Clone failed: ${message}`);
    }

    return {
      action: "cloned",
      path: repo.name,
      repo: repo.fullName,
    };
  });

  service.renderBulkResults("Clone Summary", result, (_repo, metadata) => ({
    path: metadata.path,
    action: metadata.action,
  }));

  return result;
};

const fetchUserAndClone = async (username: string, options: CloneOptions) => {
  return clone({ ...options, user: username, repos: undefined });
};

export default { clone, fetchUserAndClone };
