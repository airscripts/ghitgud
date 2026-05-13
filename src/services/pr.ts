import { promisify } from "util";
import { exec } from "child_process";

import api from "@/api/pr";
import logger from "@/core/logger";
import { PullRequest } from "@/api/pr";

import { GhitgudError } from "@/core/errors";

const execAsync = promisify(exec);

interface CleanupResult {
  branch: string;
  localDeleted: boolean;
  remoteDeleted: boolean;
  skipped: boolean;
  reason?: string;
}

async function branchExistsLocally(branch: string): Promise<boolean> {
  try {
    await execAsync(`git show-ref --verify --quiet refs/heads/${branch}`);
    return true;
  } catch {
    return false;
  }
}

async function branchExistsRemotely(branch: string): Promise<boolean> {
  try {
    await execAsync(
      `git ls-remote --heads origin ${branch} | grep -q "${branch}"`,
    );
    return true;
  } catch {
    return false;
  }
}

async function isSquashOrRebaseMerge(pr: PullRequest): Promise<boolean> {
  if (!pr.merge_commit_sha) return false;
  try {
    const response = await api.getCommit(pr.merge_commit_sha);
    const commit = await response.json();
    const parents = commit.parents?.length || 0;
    return parents === 1;
  } catch {
    return false;
  }
}

async function getDefaultBranch(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      "git remote show origin | grep 'HEAD branch' | cut -d' ' -f5",
    );
    return stdout.trim() || "main";
  } catch {
    return "main";
  }
}

async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execAsync("git branch --show-current");
  return stdout.trim();
}

async function deleteLocalBranch(branch: string, dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    logger.info(`[dry-run] Would delete local branch: ${branch}`);
    return true;
  }
  try {
    await execAsync(`git branch -D ${branch}`);
    return true;
  } catch (error) {
    logger.warn(`Failed to delete local branch ${branch}: ${error}`);
    return false;
  }
}

async function deleteRemoteBranch(branch: string, dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    logger.info(`[dry-run] Would delete remote branch: origin/${branch}`);
    return true;
  }
  try {
    await execAsync(`git push origin --delete ${branch}`);
    return true;
  } catch (error) {
    logger.warn(`Failed to delete remote branch origin/${branch}: ${error}`);
    return false;
  }
}

async function fastForwardBase(baseBranch: string, dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    logger.info(`[dry-run] Would fast-forward ${baseBranch}`);
    return true;
  }
  try {
    await execAsync(`git checkout ${baseBranch}`);
    await execAsync(`git pull origin ${baseBranch} --ff-only`);
    return true;
  } catch (error) {
    logger.warn(`Could not fast-forward ${baseBranch}: ${error}`);
    return false;
  }
}

const cleanup = async (options: { dryRun: boolean; force: boolean }) => {
  logger.info("Fetching merged pull requests.");
  const response = await api.fetchMerged();
  const prs: PullRequest[] = await response.json();
  const mergedPrs = prs.filter((p) => p.merged);

  if (mergedPrs.length === 0) {
    logger.info("No merged pull requests found.");
    return { success: true, results: [] };
  }

  logger.info(`Found ${mergedPrs.length} merged pull request(s).`);

  const currentBranch = await getCurrentBranch();
  const defaultBranch = await getDefaultBranch();
  const results: CleanupResult[] = [];

  for (const pr of mergedPrs) {
    const branch = pr.head.ref;
    const result: CleanupResult = {
      branch,
      localDeleted: false,
      remoteDeleted: false,
      skipped: false,
    };

    const isSquashRebase = await isSquashOrRebaseMerge(pr);
    if (isSquashRebase) {
      result.skipped = true;
      result.reason = "squash/rebase merge detected — skipping";
      results.push(result);
      continue;
    }

    const localExists = await branchExistsLocally(branch);
    const remoteExists = await branchExistsRemotely(branch);

    if (!localExists && !remoteExists) {
      result.skipped = true;
      result.reason = "branch already deleted";
      results.push(result);
      continue;
    }

    if (!options.force) {
      const { stdout } = await execAsync(
        `git log --oneline ${defaultBranch}..${branch} | wc -l`,
      );
      const aheadCount = parseInt(stdout.trim(), 10);
      if (aheadCount > 0) {
        result.skipped = true;
        result.reason = `branch is ${aheadCount} commit(s) ahead of ${defaultBranch}`;
        results.push(result);
        continue;
      }
    }

    if (remoteExists) {
      result.remoteDeleted = await deleteRemoteBranch(branch, options.dryRun);
    }

    if (localExists) {
      if (currentBranch === branch && !options.dryRun) {
        logger.info(`Checking out ${defaultBranch} to delete ${branch}.`);
        await execAsync(`git checkout ${defaultBranch}`);
      }
      result.localDeleted = await deleteLocalBranch(branch, options.dryRun);
    }

    results.push(result);
  }

  if (!options.dryRun && currentBranch !== defaultBranch) {
    await execAsync(`git checkout ${defaultBranch}`);
  }

  const ffSuccess = await fastForwardBase(defaultBranch, options.dryRun);

  const deletedCount = results.filter(
    (r) => !r.skipped && (r.localDeleted || r.remoteDeleted),
  ).length;
  const skippedCount = results.filter((r) => r.skipped).length;

  if (deletedCount > 0) {
    logger.success(`Cleaned up ${deletedCount} branch(es).`);
  }
  if (skippedCount > 0) {
    logger.info(`Skipped ${skippedCount} branch(es).`);
  }
  if (!ffSuccess) {
    logger.warn(`Could not fast-forward ${defaultBranch}.`);
  }

  return { success: true, results, fastForward: ffSuccess };
};

async function remoteExists(remote: string): Promise<boolean> {
  try {
    await execAsync(`git remote get-url ${remote}`, {
      stdio: ["pipe", "pipe", "ignore"] as unknown as import("child_process").StdioOptions,
    });
    return true;
  } catch {
    return false;
  }
}

async function addRemote(name: string, url: string): Promise<void> {
  await execAsync(`git remote add ${name} ${url}`, { stdio: "inherit" });
}

async function pushToRemote(
  remote: string,
  branch: string,
  force: boolean,
): Promise<void> {
  const flag = force ? " --force-with-lease" : "";
  await execAsync(`git push${flag} ${remote} HEAD:${branch}`, {
    stdio: "inherit",
  });
}

async function branchExistsOnRemote(
  remote: string,
  branch: string,
): Promise<boolean> {
  try {
    await execAsync(
      `git ls-remote --heads ${remote} refs/heads/${branch}`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] as unknown as import("child_process").StdioOptions },
    );
    return true;
  } catch {
    return false;
  }
}

async function hasDiverged(
  localBranch: string,
  remoteRef: string,
): Promise<boolean> {
  try {
    await execAsync(
      `git merge-base --is-ancestor ${remoteRef} ${localBranch}`,
      { stdio: ["pipe", "pipe", "ignore"] as unknown as import("child_process").StdioOptions },
    );
    return false;
  } catch {
    return true;
  }
}

const push = async (prNumber: number, force: boolean) => {
  logger.info(`Fetching PR #${prNumber}.`);
  const pr = await api.fetch(prNumber);

  if (!pr.head.repo) {
    throw new GhitgudError(
      "PR is from a deleted fork or same-repo branch. " +
        "Cannot push to a non-existent fork.",
    );
  }

  const forkRepo = pr.head.repo.full_name;
  const forkBranch = pr.head.ref;
  const forkUrl = pr.head.repo.html_url;

  const currentBranch = await getCurrentBranch();

  logger.info(
    `Pushing branch "${currentBranch}" to ${forkRepo}:${forkBranch}.`,
  );

  const remoteName = `fork-${forkRepo.replace(/\//g, "-")}`;

  if (!(await remoteExists(remoteName))) {
    logger.info(`Adding remote ${remoteName}.`);
    await addRemote(remoteName, forkUrl);
  }

  const hasAccess = await api.checkPushAccess(forkRepo);
  if (!hasAccess) {
    throw new GhitgudError(
      `You do not have push access to ${forkRepo}. ` +
        "Ask the contributor to enable 'Allow edits from maintainers'.",
    );
  }

  const remoteRef = `${remoteName}/${forkBranch}`;

  if (!force && (await branchExistsOnRemote(remoteName, forkBranch))) {
    const diverged = await hasDiverged(currentBranch, remoteRef);
    if (diverged) {
      throw new GhitgudError(
        "Local branch has diverged from remote. " +
          "Use --force to push anyway.",
      );
    }
  }

  await pushToRemote(remoteName, forkBranch, force);
  logger.success(`Pushed to ${forkRepo}:${forkBranch}.`);
};

export default {
  cleanup,
  push,
};
