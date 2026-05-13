import { execSync } from "child_process";

import logger from "@/core/logger";

function getCurrentBranch(): string {
  return execSync("git branch --show-current", { encoding: "utf8" }).trim();
}

function branchExistsLocally(branch: string): boolean {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branch}`);
    return true;
  } catch {
    return false;
  }
}

function branchExistsRemotely(branch: string): boolean {
  try {
    execSync(`git ls-remote --heads origin ${branch} | grep -q "${branch}"`);
    return true;
  } catch {
    return false;
  }
}

function getDefaultBranch(): string {
  try {
    const output = execSync(
      "git remote show origin | grep 'HEAD branch' | cut -d' ' -f5",
      { encoding: "utf8" },
    );
    return output.trim() || "main";
  } catch {
    return "main";
  }
}

function deleteLocalBranch(branch: string, dryRun = false): boolean {
  if (dryRun) {
    logger.info(`[dry-run] Would delete local branch: ${branch}`);
    return true;
  }
  try {
    execSync(`git branch -D ${branch}`);
    return true;
  } catch (error) {
    logger.warn(`Failed to delete local branch ${branch}: ${error}`);
    return false;
  }
}

function deleteRemoteBranch(branch: string, dryRun = false): boolean {
  if (dryRun) {
    logger.info(`[dry-run] Would delete remote branch: origin/${branch}`);
    return true;
  }
  try {
    execSync(`git push origin --delete ${branch}`);
    return true;
  } catch (error) {
    logger.warn(`Failed to delete remote branch origin/${branch}: ${error}`);
    return false;
  }
}

function fastForwardBase(baseBranch: string, dryRun = false): boolean {
  if (dryRun) {
    logger.info(`[dry-run] Would fast-forward ${baseBranch}`);
    return true;
  }
  try {
    execSync(`git checkout ${baseBranch}`);
    execSync(`git pull origin ${baseBranch} --ff-only`);
    return true;
  } catch (error) {
    logger.warn(`Could not fast-forward ${baseBranch}: ${error}`);
    return false;
  }
}

function checkoutBranch(branch: string): void {
  execSync(`git checkout ${branch}`);
}

function remoteExists(remote: string): boolean {
  try {
    execSync(`git remote get-url ${remote}`);
    return true;
  } catch {
    return false;
  }
}

function addRemote(name: string, url: string): void {
  execSync(`git remote add ${name} ${url}`, { stdio: "inherit" });
}

function pushToRemote(remote: string, branch: string, force: boolean): void {
  const flag = force ? " --force-with-lease" : "";
  execSync(`git push${flag} ${remote} HEAD:${branch}`, { stdio: "inherit" });
}

function branchExistsOnRemote(remote: string, branch: string): boolean {
  try {
    execSync(`git ls-remote --heads ${remote} refs/heads/${branch}`);
    return true;
  } catch {
    return false;
  }
}

function hasDiverged(localBranch: string, remoteRef: string): boolean {
  try {
    execSync(`git merge-base --is-ancestor ${remoteRef} ${localBranch}`);
    return false;
  } catch {
    return true;
  }
}

function listBranches(): string[] {
  const output = execSync("git branch --format='%(refname:short)'", {
    encoding: "utf8",
  });
  return output.trim().split("\n").filter(Boolean);
}

function rebaseBranch(branch: string, newBase: string): void {
  execSync(`git checkout ${branch}`);
  execSync(`git rebase ${newBase}`);
}

function pushBranch(branch: string): void {
  execSync(`git push -u origin ${branch} --force-with-lease`);
}

function getAheadCount(branch: string, baseBranch: string): number {
  try {
    const output = execSync(
      `git log --oneline ${baseBranch}..${branch} | wc -l`,
      {
        encoding: "utf8",
      },
    );
    return parseInt(output.trim(), 10);
  } catch {
    return 0;
  }
}

export default {
  getCurrentBranch,
  branchExistsLocally,
  branchExistsRemotely,
  getDefaultBranch,
  deleteLocalBranch,
  deleteRemoteBranch,
  fastForwardBase,
  checkoutBranch,
  remoteExists,
  addRemote,
  pushToRemote,
  branchExistsOnRemote,
  hasDiverged,
  listBranches,
  rebaseBranch,
  pushBranch,
  getAheadCount,
};
