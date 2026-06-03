import { execFileSync } from "child_process";

import logger from "@/core/logger";
import output from "@/core/output";
import { ConfigError } from "@/core/errors";
import { ERROR_NO_GIT_ROOT, ERROR_NO_REMOTE_URL } from "@/core/constants";

type GitOptions = {
  encoding?: BufferEncoding;
  stdio?: "inherit" | ["pipe", "pipe", "pipe"];
};

function git(args: string[], options: GitOptions = {}): string {
  const result = execFileSync("git", args, {
    ...options,
    encoding: options.encoding ?? "utf8",
  });

  return result;
}

function gitInherit(args: string[]): void {
  execFileSync("git", args, { stdio: "inherit" });
}

function getCurrentBranch(): string {
  return git(["branch", "--show-current"]).trim();
}

function branchExistsLocally(branch: string): boolean {
  try {
    git(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
    return true;
  } catch {
    return false;
  }
}

function branchExistsRemotely(branch: string): boolean {
  try {
    const output = git(["ls-remote", "--heads", "origin", branch]);
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

function getDefaultBranch(): string {
  try {
    const output = git(["remote", "show", "origin"]);
    const headLine = output
      .split("\n")
      .find((line) => line.includes("HEAD branch:"));

    return headLine?.split(":").at(-1)?.trim() || "main";
  } catch {
    return "main";
  }
}

function getRepoRoot(): string {
  try {
    const output = git(["rev-parse", "--show-toplevel"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    return output.trim();
  } catch {
    throw new ConfigError(ERROR_NO_GIT_ROOT);
  }
}

function getRemoteNames(): string[] {
  const output = git(["remote"]);
  return output.trim().split("\n").filter(Boolean);
}

function getRemoteUrl(remote = "origin"): string {
  try {
    const output = git(["remote", "get-url", remote]);

    return output.trim();
  } catch {
    if (remote !== "origin") {
      throw new ConfigError(ERROR_NO_REMOTE_URL);
    }
  }

  const remotes = getRemoteNames().filter((name) => name !== remote);

  for (const name of remotes) {
    try {
      const output = git(["remote", "get-url", name]);

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
    git(["branch", "-D", branch]);
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
    git(["push", "origin", "--delete", branch]);
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
    git(["checkout", baseBranch]);
    git(["pull", "origin", baseBranch, "--ff-only"]);
    return true;
  } catch (error) {
    logger.warn(`Could not fast-forward ${baseBranch}: ${error}`);
    return false;
  }
}

function checkoutBranch(branch: string): void {
  git(["checkout", branch]);
}

function remoteExists(remote: string): boolean {
  try {
    git(["remote", "get-url", remote]);
    return true;
  } catch {
    return false;
  }
}

function addRemote(name: string, url: string): void {
  gitInherit(["remote", "add", name, url]);
}

function pushToRemote(remote: string, branch: string, force: boolean): void {
  gitInherit([
    "push",
    ...(force ? ["--force-with-lease"] : []),
    remote,
    `HEAD:${branch}`,
  ]);
}

function branchExistsOnRemote(remote: string, branch: string): boolean {
  try {
    const output = git([
      "ls-remote",
      "--heads",
      remote,
      `refs/heads/${branch}`,
    ]);

    return output.trim().length > 0;
  } catch {
    return false;
  }
}

function hasDiverged(localBranch: string, remoteRef: string): boolean {
  try {
    git(["merge-base", "--is-ancestor", remoteRef, localBranch]);
    return false;
  } catch {
    return true;
  }
}

function listBranches(): string[] {
  const output = git(["branch", "--format=%(refname:short)"]);

  return output.trim().split("\n").filter(Boolean);
}

function listDecorationsInAncestryPath(
  branch: string,
  excludedRef: string,
): string[] {
  const output = git([
    "log",
    "--oneline",
    "--ancestry-path",
    branch,
    "--not",
    excludedRef,
    "--simplify-by-decoration",
    "--format=%D",
  ]);

  return output.trim().split("\n").filter(Boolean);
}

function rebaseBranch(branch: string, newBase: string): void {
  git(["checkout", branch]);
  git(["rebase", newBase]);
}

function pushBranch(branch: string): void {
  git(["push", "-u", "origin", branch, "--force-with-lease"]);
}

function getAheadCount(branch: string, baseBranch: string): number {
  try {
    const output = git(["log", "--oneline", `${baseBranch}..${branch}`]);

    return output.trim().split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

function isInsideRepo(): boolean {
  try {
    git(["rev-parse", "--is-inside-work-tree"]);
    return true;
  } catch {
    return false;
  }
}

function fetchBranch(remote: string, branch: string): void {
  git(["fetch", remote, branch]);
}

function stageFiles(): void {
  git(["add", "-A"]);
}

function commitChanges(message: string): void {
  git(["commit", "-m", message]);
}

function getLatestTag(): string | null {
  try {
    const output = git(["describe", "--tags", "--abbrev=0"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    return output.trim() || null;
  } catch {
    return null;
  }
}

interface CommitEntry {
  hash: string;
  subject: string;
  body: string;
}

function getCommitsSinceTag(since: string, to = "HEAD"): CommitEntry[] {
  try {
    const format = "%H%n%s%n%b%n---END---";
    const output = git(["log", `${since}..${to}`, `--format=${format}`]);

    const entries = output.split("\n---END---\n").filter(Boolean);
    return entries.map((entry) => {
      const lines = entry.split("\n");
      const hash = lines[0]?.trim() ?? "";
      const subject = lines[1]?.trim() ?? "";
      const body = lines.slice(2).join("\n").trim();
      return { hash, subject, body };
    });
  } catch {
    return [];
  }
}

function tagExists(tag: string): boolean {
  try {
    git(["rev-parse", "--verify", `refs/tags/${tag}`], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    return true;
  } catch {
    return false;
  }
}

interface SignatureResult {
  signed: boolean;
  key?: string;
}

function verifyTag(tag: string): SignatureResult {
  try {
    const output = git(["verify-tag", tag], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    return { signed: true, key: extractKey(output) };
  } catch {
    return { signed: false };
  }
}

function getCommitSignatureForTag(tag: string): SignatureResult {
  try {
    const output = git(["log", "--show-signature", "-1", `${tag}^{commit}`], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    return { signed: true, key: extractKey(output) };
  } catch {
    return { signed: false };
  }
}

function extractKey(output: string): string | undefined {
  const match = output.match(/Good signature from\s+["']?([^"'\n]+)["']?/);
  return match?.[1]?.trim() ?? undefined;
}

function createAnnotatedTag(tag: string, message: string): void {
  gitInherit(["tag", "-a", tag, "-m", message]);
}

function pushTag(tag: string): void {
  gitInherit(["push", "origin", tag]);
}

function fetchTags(): void {
  gitInherit(["fetch", "--tags"]);
}

export default {
  pushTag,
  tagExists,
  verifyTag,
  fetchTags,
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
  getLatestTag,
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
  createAnnotatedTag,
  getCommitsSinceTag,
  branchExistsLocally,
  branchExistsRemotely,
  branchExistsOnRemote,
  parseRepoFromRemoteUrl,
  getCommitSignatureForTag,
  listDecorationsInAncestryPath,
};
