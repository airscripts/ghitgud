import api from "@/api/pr";
import logger from "@/core/logger";
import git from "@/core/git";
import { PullRequest } from "@/api/pr";

import { GhitgudError } from "@/core/errors";

interface CleanupResult {
  branch: string;
  localDeleted: boolean;
  remoteDeleted: boolean;
  skipped: boolean;
  reason?: string;
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

  const currentBranch = await git.getCurrentBranch();
  const defaultBranch = await git.getDefaultBranch();
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

    const localExists = await git.branchExistsLocally(branch);
    const remoteExists = await git.branchExistsRemotely(branch);

    if (!localExists && !remoteExists) {
      result.skipped = true;
      result.reason = "branch already deleted";
      results.push(result);
      continue;
    }

    if (!options.force) {
      const aheadCount = await git.getAheadCount(branch, defaultBranch);
      if (aheadCount > 0) {
        result.skipped = true;
        result.reason = `branch is ${aheadCount} commit(s) ahead of ${defaultBranch}`;
        results.push(result);
        continue;
      }
    }

    if (remoteExists) {
      result.remoteDeleted = await git.deleteRemoteBranch(branch, options.dryRun);
    }

    if (localExists) {
      if (currentBranch === branch && !options.dryRun) {
        logger.info(`Checking out ${defaultBranch} to delete ${branch}.`);
        await git.checkoutBranch(defaultBranch);
      }
      result.localDeleted = await git.deleteLocalBranch(branch, options.dryRun);
    }

    results.push(result);
  }

  if (!options.dryRun && currentBranch !== defaultBranch) {
    await git.checkoutBranch(defaultBranch);
  }

  const ffSuccess = await git.fastForwardBase(defaultBranch, options.dryRun);

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

  const currentBranch = await git.getCurrentBranch();

  logger.info(
    `Pushing branch "${currentBranch}" to ${forkRepo}:${forkBranch}.`,
  );

  const remoteName = `fork-${forkRepo.replace(/\//g, "-")}`;

  if (!(await git.remoteExists(remoteName))) {
    logger.info(`Adding remote ${remoteName}.`);
    await git.addRemote(remoteName, forkUrl);
  }

  const hasAccess = await api.checkPushAccess(forkRepo);
  if (!hasAccess) {
    throw new GhitgudError(
      `You do not have push access to ${forkRepo}. ` +
        "Ask the contributor to enable 'Allow edits from maintainers'.",
    );
  }

  const remoteRef = `${remoteName}/${forkBranch}`;

  if (!force && (await git.branchExistsOnRemote(remoteName, forkBranch))) {
    const diverged = await git.hasDiverged(currentBranch, remoteRef);
    if (diverged) {
      throw new GhitgudError(
        "Local branch has diverged from remote. " +
          "Use --force to push anyway.",
      );
    }
  }

  await git.pushToRemote(remoteName, forkBranch, force);
  logger.success(`Pushed to ${forkRepo}:${forkBranch}.`);
};

export default {
  cleanup,
  push,
};
