import { execSync } from "child_process";
import output from "@/core/output";
import logger from "@/core/logger";

interface StaleBranch {
  name: string;
  daysOld: number;
  merged: boolean;
  lastCommit: string;
}

const getStaleBranches = (options: {
  days: number;
  merged?: boolean;
}): StaleBranch[] => {
  const branches = execSync(
    "git branch --format='%(refname:short) %(upstream:track) %(creatordate:iso)'",
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);

  const now = Date.now();
  const staleBranches: StaleBranch[] = [];

  for (const line of branches) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;
    const name = parts[0];
    if (name === "main" || name === "master" || name === "develop") continue;
    const dateStr = parts.slice(2).join(" ");
    const commitDate = new Date(dateStr).getTime();
    if (isNaN(commitDate)) continue;
    const daysOld = Math.floor((now - commitDate) / (1000 * 60 * 60 * 24));
    if (daysOld < options.days) continue;

    let isMerged: boolean;
    try {
      execSync(`git merge-base --is-ancestor ${name} HEAD`, {
        encoding: "utf8",
      });
      isMerged = true;
    } catch {
      isMerged = false;
    }

    if (options.merged && !isMerged) continue;

    staleBranches.push({
      name,
      daysOld,
      merged: isMerged,
      lastCommit: dateStr,
    });
  }

  return staleBranches;
};

const stale = (options: { days: number; merged?: boolean }) => {
  logger.start(`Finding stale branches (>${options.days} days).`);
  const branches = getStaleBranches({
    days: options.days,
    merged: options.merged,
  });
  output.renderTable(
    branches.map((b) => ({
      branch: b.name,
      days: b.daysOld,
      merged: b.merged ? "yes" : "no",
      lastCommit: b.lastCommit,
    })),
    { emptyMessage: "No stale branches found." },
  );
  logger.success(`Found ${branches.length} stale branch(es).`);
  return { success: true, branches };
};

const sweep = (options: {
  pattern: string;
  days: number;
  merged?: boolean;
  dry?: boolean;
}) => {
  logger.start(
    `${options.dry ? "Previewing" : "Sweeping"} branches matching "${options.pattern}".`,
  );
  const branches = getStaleBranches({
    days: options.days,
    merged: options.merged,
  });
  const matching = branches.filter((b) => {
    const patternRegex = new RegExp(
      options.pattern.replace(/\*/g, ".*").replace(/\?/g, "."),
    );
    return patternRegex.test(b.name);
  });

  if (!matching.length) {
    logger.success("No branches match the pattern.");
    return { success: true, deleted: [] };
  }

  const deleted: string[] = [];
  for (const branch of matching) {
    if (options.dry) {
      deleted.push(branch.name);
      continue;
    }
    try {
      execSync(`git branch -D ${branch.name}`, { encoding: "utf8" });
      deleted.push(branch.name);
    } catch {
      // Skip branches that can't be deleted.
    }
  }

  output.renderTable(
    deleted.map((name) => ({
      branch: name,
      action: options.dry ? "would delete" : "deleted",
    })),
    { emptyMessage: "No branches to sweep." },
  );

  logger.success(
    `${options.dry ? "Would delete" : "Deleted"} ${deleted.length} branch(es).`,
  );
  return { success: true, deleted };
};

export default { stale, sweep };
