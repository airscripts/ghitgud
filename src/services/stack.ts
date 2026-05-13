import path from "path";
import { execSync } from "child_process";

import api from "@/api/pr";
import io from "@/core/io";
import git from "@/core/git";
import logger from "@/core/logger";
import { PullRequest } from "@/api/pr";
import { GhitgudError } from "@/core/errors";

const STACK_FILE = "stack.json";
const CWD = process.cwd();
const STACK_PATH = path.join(CWD, ".ghitgud", STACK_FILE);

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
    const stdout = execSync(
      `git log --oneline --ancestry-path ${branch} --not origin/main --simplify-by-decoration --format="%D"`,
      { encoding: "utf8" },
    );
    const lines = stdout.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      const match = line.match(/HEAD -> (.+)/);
      if (match && match[1] !== branch && branches.includes(match[1])) {
        return match[1];
      }
    }
  } catch {
    // fall through
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

  // If parent is also a tracked stack, add this branch as child
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
  const branch = git.getCurrentBranch();
  const defaultBranch = git.getDefaultBranch();
  const baseBranch = options.base || "auto";

  if (git.branchExistsLocally(branch)) {
    logger.info(`Creating stack from current branch: ${branch}`);
    createStackEntry(
      branch,
      baseBranch === "auto" ? defaultBranch : baseBranch,
    );
    return { success: true };
  } else {
    throw new GhitgudError("Could not determine current branch.");
  }
};

const list = async () => {
  const data = getStackData();
  const branch = git.getCurrentBranch();
  const stack = data.stacks[branch];

  if (!stack) {
    logger.info("Current branch is not part of a tracked stack.");
    return { success: true, stacks: data.stacks, current: null };
  }

  const response = await api.listOpen();
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

  logger.info(`Stack for "${branch}":`);
  logger.info(`  Parent: ${stack.parent} (${parentStatus})`);
  logger.info(
    `  Children: ${childStatuses.length > 0 ? childStatuses.join(", ") : "none"}`,
  );

  return {
    success: true,
    current: branch,
    parent: stack.parent,
    parentStatus,
    children: childStatuses,
  };
};

const update = async () => {
  const data = getStackData();
  const branch = git.getCurrentBranch();
  const stack = data.stacks[branch];

  if (!stack) {
    throw new GhitgudError("Current branch is not part of a tracked stack.");
  }

  const response = await api.listOpen();
  const prs: PullRequest[] = await response.json();
  const prMap = getOpenPrsMap(prs);

  // Check if parent PR is still open
  const parentPr = stack.parentPr ? prMap[stack.parent] : null;

  if (!parentPr && stack.parentPr) {
    // Parent PR was merged/closed — rebase children
    logger.info(
      `Parent PR #${stack.parentPr} merged/closed. Rebasing children onto ${stack.parent}.`,
    );

    for (const child of stack.children) {
      if (git.branchExistsLocally(child)) {
        logger.info(`Rebasing ${child} onto ${stack.parent}.`);
        git.rebaseBranch(child, stack.parent);

        const childPr = prMap[child];
        if (childPr) {
          await api.updatePr(childPr.number, { base: stack.parent });
          logger.success(
            `Updated PR #${childPr.number} base to ${stack.parent}.`,
          );
        }
      }
    }

    // Update stack: parent PR is now null, children become direct
    data.stacks[branch].parentPr = null;
    saveStackData(data);
  } else if (parentPr) {
    logger.info(
      `Parent PR #${parentPr.number} is still open. Nothing to update.`,
    );
  } else {
    logger.info("No parent PR tracked. Nothing to update.");
  }

  return { success: true };
};

const pushStack = async (options: { title?: string; draft: boolean }) => {
  const data = getStackData();
  const branch = git.getCurrentBranch();
  const stack = data.stacks[branch];

  if (!stack) {
    throw new GhitgudError("Current branch is not part of a tracked stack.");
  }

  const response = await api.listOpen();
  const prs: PullRequest[] = await response.json();
  const prMap = getOpenPrsMap(prs);

  // Collect all branches in this stack chain
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

  // Deduplicate and order
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
      logger.info(`Pushing ${b}...`);
      git.pushBranch(b);

      const existingPr = prMap[b];
      if (existingPr) {
        // Update existing PR base if changed
        if (existingPr.base.ref !== base) {
          await api.updatePr(existingPr.number, { base });
          logger.success(`Updated PR #${existingPr.number} base to ${base}.`);
        } else {
          logger.info(`PR #${existingPr.number} already up to date.`);
        }
      } else {
        const titleTemplate = options.title || "feat: {branch}";
        const title = titleTemplate.replace(/{branch}/g, b);
        const parentPr = prMap[base];
        const dependsLine = parentPr
          ? `\n\nDepends on #${parentPr.number}`
          : "";
        const body = `Stacked PR for ${b}.${dependsLine}`;

        const newPr = await api.createPr({
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
  const data = getStackData();
  const branch = git.getCurrentBranch();
  const stack = data.stacks[branch];

  if (!stack) {
    throw new GhitgudError(
      `Current branch "${branch}" is not part of a tracked stack.`,
    );
  }

  if (options.list) {
    const chain = await getFullChain(data, branch);
    logger.info("Stack chain:");
    for (let i = 0; i < chain.length; i++) {
      const marker = chain[i] === branch ? " (current)" : "";
      logger.info(`  ${i + 1}. ${chain[i]}${marker}`);
    }
    return { success: true, chain };
  }

  if (options.reverse) {
    const targetBranch = stack.parent;
    if (!targetBranch) {
      throw new GhitgudError(
        "No previous branch in the stack — you are at the beginning of the chain.",
      );
    }
    if (!git.branchExistsLocally(targetBranch)) {
      throw new GhitgudError(
        `Parent branch "${targetBranch}" does not exist locally. Run "git fetch" if it should be remote.`,
      );
    }
    git.checkoutBranch(targetBranch);
    logger.success(`Checked out "${targetBranch}".`);
    return { success: true, branch: targetBranch };
  } else {
    if (stack.children.length === 0) {
      throw new GhitgudError(
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
      throw new GhitgudError(
        `Child branch "${targetBranch}" does not exist locally. Run "git fetch" if it should be remote.`,
      );
    }
    git.checkoutBranch(targetBranch);
    logger.success(`Checked out "${targetBranch}".`);
    return { success: true, branch: targetBranch };
  }
};

export default {
  create,
  list,
  update,
  push: pushStack,
  next,
};
