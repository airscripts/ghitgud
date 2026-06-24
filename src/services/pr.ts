import api from "@/api/pr";
import git from "@/core/git";
import output from "@/core/output";
import logger from "@/core/logger";
import { PullRequest } from "@/api/pr";

import { GhitgudError } from "@/core/errors";

interface CleanupResult {
  branch: string;
  reason?: string;
  skipped: boolean;
  localDeleted: boolean;
  remoteDeleted: boolean;
}

async function isSquashOrRebaseMerge(
  pr: PullRequest,
  repo: string,
): Promise<boolean> {
  if (!pr.merge_commit_sha) return false;
  try {
    const response = await api.getCommit(pr.merge_commit_sha, repo);
    const commit = await response.json();
    const parents = commit.parents?.length || 0;
    return parents === 1;
  } catch {
    return false;
  }
}

const cleanup = async (
  repo: string,
  options: { dryRun: boolean; force: boolean },
) => {
  logger.start(
    options.dryRun
      ? "Scanning merged pull requests in dry-run mode."
      : "Scanning merged pull requests for cleanup.",
  );

  const response = await api.fetchMerged(repo);
  const prs: PullRequest[] = await response.json();
  const mergedPrs = prs.filter((p) => p.merged);

  if (mergedPrs.length === 0) {
    logger.success("No merged pull requests found.");
    return { success: true, results: [] };
  }

  output.log(`Found ${mergedPrs.length} merged pull request(s) to evaluate.`);

  const currentBranch = git.getCurrentBranch();
  const defaultBranch = git.getDefaultBranch();
  const results: CleanupResult[] = [];

  for (const pr of mergedPrs) {
    const branch = pr.head.ref;
    const result: CleanupResult = {
      branch,
      localDeleted: false,
      remoteDeleted: false,
      skipped: false,
    };

    const isSquashRebase = await isSquashOrRebaseMerge(pr, repo);
    if (isSquashRebase) {
      result.skipped = true;
      result.reason = "squash/rebase merge detected — skipping";
      results.push(result);
      continue;
    }

    const localExists = git.branchExistsLocally(branch);
    const remoteExists = git.branchExistsRemotely(branch);

    if (!localExists && !remoteExists) {
      result.skipped = true;
      result.reason = "branch already deleted";
      results.push(result);
      continue;
    }

    if (!options.force) {
      const aheadCount = git.getAheadCount(branch, defaultBranch);
      if (aheadCount > 0) {
        result.skipped = true;
        result.reason = `branch is ${aheadCount} commit(s) ahead of ${defaultBranch}`;
        results.push(result);
        continue;
      }
    }

    if (remoteExists) {
      result.remoteDeleted = git.deleteRemoteBranch(branch, options.dryRun);
    }

    if (localExists) {
      if (currentBranch === branch && !options.dryRun) {
        output.log(`Checking out ${defaultBranch} to delete ${branch}.`);
        git.checkoutBranch(defaultBranch);
      }

      result.localDeleted = git.deleteLocalBranch(branch, options.dryRun);
    }

    results.push(result);
  }

  if (!options.dryRun && currentBranch !== defaultBranch) {
    git.checkoutBranch(defaultBranch);
  }

  const ffSuccess = git.fastForwardBase(defaultBranch, options.dryRun);

  const deletedCount = results.filter(
    (r) => !r.skipped && (r.localDeleted || r.remoteDeleted),
  ).length;

  const skippedCount = results.filter((r) => r.skipped).length;

  if (deletedCount > 0) {
    logger.success(
      options.dryRun
        ? `${deletedCount} branch(es) would be cleaned up.`
        : `Cleaned up ${deletedCount} branch(es).`,
    );
  }

  if (skippedCount > 0) {
    logger.warn(`Skipped ${skippedCount} branch(es).`);
  }

  if (!ffSuccess) {
    logger.warn(`Could not fast-forward ${defaultBranch}.`);
  }

  output.renderSummary("Cleanup Summary", [
    ["Candidates", mergedPrs.length],
    ["Affected", deletedCount],
    ["Skipped", skippedCount],
    ["Fast-forward", ffSuccess ? "yes" : "no"],
  ]);

  return { success: true, results, fastForward: ffSuccess };
};

const push = async (prNumber: number, repo: string, force: boolean) => {
  logger.start(`Loading PR #${prNumber}.`);
  const pr = await api.fetch(prNumber, repo);

  if (!pr.head.repo) {
    throw new GhitgudError(
      "PR is from a deleted fork or same-repo branch. " +
        "Cannot push to a non-existent fork.",
    );
  }

  const forkRepo = pr.head.repo.full_name;
  const forkBranch = pr.head.ref;
  const forkUrl = pr.head.repo.html_url;

  const currentBranch = git.getCurrentBranch();

  logger.start(
    `Pushing branch "${currentBranch}" to ${forkRepo}:${forkBranch}.`,
  );

  const remoteName = `fork-${forkRepo.replace(/\//g, "-")}`;

  if (!git.remoteExists(remoteName)) {
    logger.start(`Adding remote ${remoteName}.`);
    git.addRemote(remoteName, forkUrl);
  }

  if (!pr.maintainer_can_modify) {
    throw new GhitgudError(
      `PR #${prNumber} does not allow edits from maintainers. ` +
        "Ask the contributor to enable 'Allow edits from maintainers'.",
    );
  }

  const remoteRef = `${remoteName}/${forkBranch}`;

  if (!force && git.branchExistsOnRemote(remoteName, forkBranch)) {
    const diverged = git.hasDiverged(currentBranch, remoteRef);
    if (diverged) {
      throw new GhitgudError(
        "Local branch has diverged from remote. " +
          "Use --force to push anyway.",
      );
    }
  }

  git.pushToRemote(remoteName, forkBranch, force);
  logger.success(
    `Pushed "${currentBranch}" to ${forkRepo}:${forkBranch}${force ? " with --force" : ""}.`,
  );

  return {
    success: true,
    metadata: { prNumber, forkRepo, forkBranch },
  };
};

export default {
  cleanup,
  push,
};
