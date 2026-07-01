import path from "path";

import api from "@/api/pr";
import io from "@/core/io";
import git from "@/core/git";
import output from "@/core/output";
import logger from "@/core/logger";
import type { PullRequest } from "@/types";
import { GitfleetError } from "@/core/errors";

const STACK_FILE = "stack.json";
const CWD = process.cwd();
const STACK_PATH = path.join(CWD, ".gitfleet", STACK_FILE);

interface StackEntry {
  parent: string;
  parentPr: number | null;
  children: string[];
}

interface StackData {
  stacks: Record<string, StackEntry>;
}

function getStackData(): StackData {
  if (!io.fileExists(STACK_PATH)) return { stacks: {} };
  return io.readJsonFile<StackData>(STACK_PATH);
}

function saveStackData(data: StackData): void {
  io.ensureDir(path.dirname(STACK_PATH));
  io.writeJsonFile(STACK_PATH, data);
}

function findParentBranch(branch: string, branches: string[]): string {
  try {
    const lines = git.listDecorationsInAncestryPath(branch, "origin/main");
    for (const line of lines) {
      const match = line.match(/HEAD -> (.+)/);

      if (match && match[1] !== branch && branches.includes(match[1])) {
        return match[1];
      }
    }
  } catch {
    // If the git command fails (e.g., no commits), fall back to default.
  }
  return "main";
}

async function getFullChain(
  data: StackData,
  startBranch: string,
): Promise<string[]> {
  let root = startBranch;

  while (data.stacks[root]?.parent && data.stacks[data.stacks[root].parent]) {
    root = data.stacks[root].parent;
  }

  const chain: string[] = [];
  const visited = new Set<string>();

  function walk(b: string) {
    if (visited.has(b)) return;
    visited.add(b);
    chain.push(b);
    const entry = data.stacks[b];

    if (entry) {
      for (const child of entry.children) {
        walk(child);
      }
    }
  }

  walk(root);
  return chain;
}

function getOpenPrsMap(prs: PullRequest[]): Record<string, PullRequest> {
  const map: Record<string, PullRequest> = {};

  for (const pr of prs) {
    if (pr.state === "open") map[pr.head.ref] = pr;
  }

  return map;
}

function createStackEntry(branch: string, baseBranch: string): void {
  const data = getStackData();
  const branches = git.listBranches();

  let parent = baseBranch;
  if (parent === "auto") {
    parent = findParentBranch(branch, branches);
  }

  data.stacks[branch] = {
    parent,
    parentPr: null,
    children: [],
  };

  if (data.stacks[parent]) {
    if (!data.stacks[parent].children.includes(branch)) {
      data.stacks[parent].children.push(branch);
    }
  }

  saveStackData(data);
  logger.success(
    `Stack initialized for branch "${branch}" with parent "${parent}".`,
  );
}

const create = async (options: { base?: string }) => {
  if (!git.isInsideRepo()) {
    throw new GitfleetError(
      "Not in a git repository. Run this command from inside a git repo.",
    );
  }

  const branch = git.getCurrentBranch();
  const defaultBranch = git.getDefaultBranch();
  const baseBranch = options.base || "auto";

  if (git.branchExistsLocally(branch)) {
    logger.start(`Creating a stack from "${branch}".`);
    createStackEntry(
      branch,
      baseBranch === "auto" ? defaultBranch : baseBranch,
    );

    return { success: true };
  } else {
    throw new GitfleetError("Could not determine current branch.");
  }
};

const list = async (repo: string) => {
  if (!git.isInsideRepo()) {
    throw new GitfleetError(
      "Not in a git repository. Run this command from inside a git repo.",
    );
  }

  const data = getStackData();
  const branch = git.getCurrentBranch();
  const stack = data.stacks[branch];

  if (!stack) {
    logger.warn("Current branch is not part of a tracked stack.");
    return { success: true, stacks: data.stacks, current: null };
  }

  const response = await api.listOpen(repo);
  const prs: PullRequest[] = await response.json();
  const prMap = getOpenPrsMap(prs);

  const parentPr = stack.parentPr ? prMap[stack.parent] : null;
  const parentStatus = parentPr
    ? `open (#${parentPr.number})`
    : "none / merged";

  const childStatuses = stack.children.map((child) => {
    const childPr = prMap[child];
    return childPr ? `${child} (#${childPr.number})` : `${child} (no PR)`;
  });

  output.renderSummary(`Stack: ${branch}`, [
    ["Parent", `${stack.parent} (${parentStatus})`],
    ["Children", childStatuses.length > 0 ? childStatuses.join(", ") : "none"],
  ]);

  return {
    success: true,
    current: branch,
    parent: stack.parent,
    parentStatus,
    children: childStatuses,
  };
};

const update = async (repo: string) => {
  if (!git.isInsideRepo()) {
    throw new GitfleetError(
      "Not in a git repository. Run this command from inside a git repo.",
    );
  }

  const data = getStackData();
  const branch = git.getCurrentBranch();
  const stack = data.stacks[branch];

  if (!stack) {
    throw new GitfleetError("Current branch is not part of a tracked stack.");
  }

  const response = await api.listOpen(repo);
  const prs: PullRequest[] = await response.json();
  const prMap = getOpenPrsMap(prs);
  const parentPr = stack.parentPr ? prMap[stack.parent] : null;

  if (!parentPr && stack.parentPr) {
    logger.start(
      `Parent PR #${stack.parentPr} merged/closed. Rebasing children onto ${stack.parent}.`,
    );

    for (const child of stack.children) {
      if (git.branchExistsLocally(child)) {
        logger.start(`Rebasing ${child} onto ${stack.parent}.`);
        git.rebaseBranch(child, stack.parent);

        const childPr = prMap[child];
        if (childPr) {
          await api.updatePr(repo, childPr.number, { base: stack.parent });
          logger.success(
            `Updated PR #${childPr.number} base to ${stack.parent}.`,
          );
        }
      }
    }
    data.stacks[branch].parentPr = null;
    saveStackData(data);
  } else if (parentPr) {
    output.log(
      `Parent PR #${parentPr.number} is still open. Nothing to update.`,
    );
  } else {
    output.log("No parent PR tracked. Nothing to update.");
  }

  return { success: true };
};

const pushStack = async (
  repo: string,
  options: { title?: string; draft: boolean },
) => {
  if (!git.isInsideRepo()) {
    throw new GitfleetError(
      "Not in a git repository. Run this command from inside a git repo.",
    );
  }

  const data = getStackData();
  const branch = git.getCurrentBranch();
  const stack = data.stacks[branch];

  if (!stack) {
    throw new GitfleetError("Current branch is not part of a tracked stack.");
  }

  const response = await api.listOpen(repo);
  const prs: PullRequest[] = await response.json();
  const prMap = getOpenPrsMap(prs);
  const branchesToPush: { branch: string; base: string }[] = [];

  function collectUpward(b: string): void {
    const s = data.stacks[b];
    if (!s) return;
    const parent = s.parent;
    const parentPrObj = prMap[parent];
    const base = parentPrObj ? parentPrObj.head.ref : parent;

    if (!branchesToPush.find((x) => x.branch === b)) {
      branchesToPush.unshift({ branch: b, base });
    }

    if (s.parent && data.stacks[s.parent]) {
      collectUpward(s.parent);
    }
  }

  function collectDownward(b: string): void {
    const s = data.stacks[b];
    if (!s) return;
    const ownPr = prMap[b];
    const base = ownPr ? ownPr.base.ref : s.parent;

    if (!branchesToPush.find((x) => x.branch === b)) {
      branchesToPush.push({ branch: b, base });
    }

    for (const child of s.children) {
      if (!branchesToPush.find((x) => x.branch === child)) {
        const childBase = ownPr ? ownPr.head.ref : b;
        branchesToPush.push({ branch: child, base: childBase });
      }

      collectDownward(child);
    }
  }

  collectUpward(branch);
  collectDownward(branch);

  const seen = new Set<string>();
  const ordered: typeof branchesToPush = [];

  for (const item of branchesToPush) {
    if (!seen.has(item.branch)) {
      seen.add(item.branch);
      ordered.push(item);
    }
  }

  for (const { branch: b, base } of ordered) {
    if (git.branchExistsLocally(b)) {
      logger.start(`Pushing ${b}...`);
      git.pushBranch(b);

      const existingPr = prMap[b];
      if (existingPr) {
        if (existingPr.base.ref !== base) {
          await api.updatePr(repo, existingPr.number, { base });
          logger.success(`Updated PR #${existingPr.number} base to ${base}.`);
        } else {
          output.log(`PR #${existingPr.number} already up to date.`);
        }
      } else {
        const titleTemplate = options.title || "feat: {branch}";
        const title = titleTemplate.replace(/{branch}/g, b);
        const parentPr = prMap[base];

        const dependsLine = parentPr
          ? `\n\nDepends on #${parentPr.number}`
          : "";

        const body = `Stacked PR for ${b}.${dependsLine}`;
        const newPr = await api.createPr(repo, {
          title,
          head: b,
          base,
          body,
          draft: options.draft,
        });

        logger.success(`Created PR #${newPr.number} for ${b} -> ${base}.`);
      }
    }
  }

  return { success: true };
};

const next = async (options: { reverse?: boolean; list?: boolean }) => {
  if (!git.isInsideRepo()) {
    throw new GitfleetError(
      "Not in a git repository. Run this command from inside a git repo.",
    );
  }

  const data = getStackData();
  const branch = git.getCurrentBranch();
  const stack = data.stacks[branch];

  if (!stack) {
    throw new GitfleetError(
      `Current branch "${branch}" is not part of a tracked stack.`,
    );
  }

  if (options.list) {
    const chain = await getFullChain(data, branch);
    output.renderList(
      chain.map((item) => `${item}${item === branch ? " (current)" : ""}`),
      "No branches in the current stack.",
    );

    return { success: true, chain };
  }

  if (options.reverse) {
    const targetBranch = stack.parent;
    if (!targetBranch) {
      throw new GitfleetError(
        "No previous branch in the stack — you are at the beginning of the chain.",
      );
    }

    if (!git.branchExistsLocally(targetBranch)) {
      throw new GitfleetError(
        `Parent branch "${targetBranch}" does not exist locally. Run "git fetch" if it should be remote.`,
      );
    }

    git.checkoutBranch(targetBranch);
    logger.success(`Checked out "${targetBranch}".`);
    return { success: true, branch: targetBranch };
  } else {
    if (stack.children.length === 0) {
      throw new GitfleetError(
        "No next branch in the stack — you are at the end of the chain.",
      );
    }

    if (stack.children.length > 1) {
      logger.warn(
        `Multiple children found: ${stack.children.join(", ")}. Checking out first: ${stack.children[0]}.`,
      );
    }
    const targetBranch = stack.children[0];
    if (!git.branchExistsLocally(targetBranch)) {
      throw new GitfleetError(
        `Child branch "${targetBranch}" does not exist locally. Run "git fetch" if it should be remote.`,
      );
    }

    git.checkoutBranch(targetBranch);
    logger.success(`Checked out "${targetBranch}".`);
    return { success: true, branch: targetBranch };
  }
};

export default {
  next,
  list,
  create,
  update,
  push: pushStack,
};
