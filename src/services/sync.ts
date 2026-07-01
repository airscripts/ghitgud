import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import output from "@/core/output";
import logger from "@/core/logger";
import { GitfleetError } from "@/core/errors";

const findGitRepos = (root: string): string[] => {
  const repos: string[] = [];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory() && fs.existsSync(path.join(full, ".git"))) {
      repos.push(full);
    }
  }
  return repos;
};

const syncall = (options: { root?: string } = {}) => {
  const root = options.root ?? process.cwd();
  if (!fs.existsSync(root))
    throw new GitfleetError(`Directory not found: ${root}`);
  const repos = findGitRepos(root);
  if (!repos.length) {
    logger.success("No git repositories found.");
    return { success: true, results: [] };
  }
  logger.start(`Syncing ${repos.length} repositor(ies).`);
  const results: Array<{ repo: string; success: boolean; output: string }> = [];
  for (const repo of repos) {
    try {
      execSync("git pull --ff-only", {
        cwd: repo,
        encoding: "utf8",
        timeout: 30000,
      });
      results.push({
        repo: path.basename(repo),
        success: true,
        output: "synced",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({
        repo: path.basename(repo),
        success: false,
        output: message.slice(0, 80),
      });
    }
  }
  output.renderTable(
    results.map((r) => ({
      repo: r.repo,
      status: r.success ? "synced" : "failed",
      output: r.success ? r.output : r.output.slice(0, 60),
    })),
    { emptyMessage: "No results." },
  );
  logger.success(
    `Synced ${results.filter((r) => r.success).length}/${results.length} repositor(ies).`,
  );
  return { success: results.every((r) => r.success), results };
};

const statusall = (options: { root?: string } = {}) => {
  const root = options.root ?? process.cwd();
  if (!fs.existsSync(root))
    throw new GitfleetError(`Directory not found: ${root}`);
  const repos = findGitRepos(root);
  if (!repos.length) {
    logger.success("No git repositories found.");
    return { success: true, results: [] };
  }
  logger.start(`Checking status of ${repos.length} repositor(ies).`);
  const results: Array<{
    repo: string;
    branch: string;
    dirty: boolean;
    ahead: number;
    behind: number;
  }> = [];
  for (const repo of repos) {
    try {
      const branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd: repo,
        encoding: "utf8",
      }).trim();
      const status = execSync("git status --porcelain", {
        cwd: repo,
        encoding: "utf8",
      }).trim();
      const ahead =
        parseInt(
          execSync(
            "git rev-list --count @{upstream}..HEAD 2>/dev/null || echo 0",
            { cwd: repo, encoding: "utf8" },
          ).trim(),
          10,
        ) || 0;
      const behind =
        parseInt(
          execSync(
            "git rev-list --count HEAD..@{upstream} 2>/dev/null || echo 0",
            { cwd: repo, encoding: "utf8" },
          ).trim(),
          10,
        ) || 0;
      results.push({
        repo: path.basename(repo),
        branch,
        dirty: status.length > 0,
        ahead,
        behind,
      });
    } catch {
      results.push({
        repo: path.basename(repo),
        branch: "?",
        dirty: false,
        ahead: 0,
        behind: 0,
      });
    }
  }
  output.renderTable(
    results.map((r) => ({
      repo: r.repo,
      branch: r.branch,
      status: r.dirty ? "dirty" : "clean",
      ahead: r.ahead,
      behind: r.behind,
    })),
    { emptyMessage: "No results." },
  );
  logger.success(`Checked ${results.length} repositor(ies).`);
  return { success: true, results };
};

export default { syncall, statusall };
