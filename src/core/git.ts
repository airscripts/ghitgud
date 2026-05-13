import { promisify } from "util";
import { exec } from "child_process";

import logger from "@/core/logger";

const execAsync = promisify(exec);

async function getCurrentBranch(): Promise<string> {
  const { stdout } = await execAsync("git branch --show-current");
  return stdout.trim();
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

async function deleteLocalBranch(branch: string, dryRun = false): Promise<boolean> {
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

async function deleteRemoteBranch(branch: string, dryRun = false): Promise<boolean> {
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

async function fastForwardBase(baseBranch: string, dryRun = false): Promise<boolean> {
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

async function checkoutBranch(branch: string): Promise<void> {
  await execAsync(`git checkout ${branch}`);
}

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

async function listBranches(): Promise<string[]> {
  const { stdout } = await execAsync("git branch --format='%(refname:short)'");
  return stdout.trim().split("\n").filter(Boolean);
}

async function rebaseBranch(branch: string, newBase: string): Promise<void> {
  await execAsync(`git checkout ${branch}`);
  await execAsync(`git rebase ${newBase}`);
}

async function pushBranch(branch: string): Promise<void> {
  await execAsync(`git push -u origin ${branch} --force-with-lease`);
}

async function getAheadCount(branch: string, baseBranch: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`git log --oneline ${baseBranch}..${branch} | wc -l`);
    return parseInt(stdout.trim(), 10);
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
