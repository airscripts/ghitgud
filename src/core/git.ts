import { execSync } from "child_process";

import logger from "@/core/logger";
import output from "@/core/output";
import { ConfigError } from "@/core/errors";
import { ERROR_NO_GIT_ROOT, ERROR_NO_REMOTE_URL } from "@/core/constants";

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

function getRepoRoot(): string {
  try {
    const output = execSync("git rev-parse --show-toplevel", {
      encoding: "utf8",
    });

    return output.trim();
  } catch {
    throw new ConfigError(ERROR_NO_GIT_ROOT);
  }
}

function getRemoteNames(): string[] {
  const output = execSync("git remote", { encoding: "utf8" });
  return output.trim().split("\n").filter(Boolean);
}

function getRemoteUrl(remote = "origin"): string {
  try {
    const output = execSync(`git remote get-url ${remote}`, {
      encoding: "utf8",
    });

    return output.trim();
  } catch {
    if (remote !== "origin") {
      throw new ConfigError(ERROR_NO_REMOTE_URL);
    }
  }

  const remotes = getRemoteNames().filter((name) => name !== remote);

  for (const name of remotes) {
    try {
      const output = execSync(`git remote get-url ${name}`, {
        encoding: "utf8",
      });

      return output.trim();
    } catch {
      continue;
    }
  }

  throw new ConfigError(ERROR_NO_REMOTE_URL);
}

function parseRepoFromRemoteUrl(remoteUrl: string): string | null {
  const sshMatch = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (sshMatch?.[1]) return sshMatch[1];

  const httpsMatch = remoteUrl.match(/github\.com\/(.+?)(?:\.git)?$/);
  if (httpsMatch?.[1]) return httpsMatch[1];

  return null;
}

function deleteLocalBranch(branch: string, dryRun = false): boolean {
  if (dryRun) {
    output.log(`[dry-run] Would delete local branch: ${branch}`);
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
    output.log(`[dry-run] Would delete remote branch: origin/${branch}`);
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
    output.log(`[dry-run] Would fast-forward ${baseBranch}`);
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
      { encoding: "utf8" },
    );

    return parseInt(output.trim(), 10);
  } catch {
    return 0;
  }
}

function isInsideRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", { encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
}

function fetchBranch(remote: string, branch: string): void {
  execSync(`git fetch ${remote} ${branch}`);
}

function stageFiles(): void {
  execSync("git add -A");
}

function commitChanges(message: string): void {
  execSync(`git commit -m "${message}"`);
}

export default {
  addRemote,
  stageFiles,
  pushBranch,
  getRepoRoot,
  hasDiverged,
  fetchBranch,
  getRemoteUrl,
  remoteExists,
  pushToRemote,
  listBranches,
  rebaseBranch,
  isInsideRepo,
  getAheadCount,
  commitChanges,
  checkoutBranch,
  getRemoteNames,
  fastForwardBase,
  getCurrentBranch,
  getDefaultBranch,
  deleteLocalBranch,
  deleteRemoteBranch,
  branchExistsLocally,
  branchExistsRemotely,
  branchExistsOnRemote,
  parseRepoFromRemoteUrl,
};
