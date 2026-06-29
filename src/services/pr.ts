import api from "@/api/pr";
import git from "@/core/git";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import type { PullRequest, RepositoryMergeSettings } from "@/types";

interface CleanupResult {
  branch: string;
  reason?: string;
  skipped: boolean;
  localDeleted: boolean;
  remoteDeleted: boolean;
}

interface PullRequestListOptions {
  base?: string;
  head?: string;
  limit?: number;
  state?: "open" | "closed" | "merged" | "all";
}

interface SearchPayload {
  items?: Array<{
    id?: number;
    state?: string;
    title?: string;
    number?: number;
    html_url?: string;
    updated_at?: string;
    user?: { login?: string } | null;
  }>;
}

function parsePrNumber(value: string | number): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new GhitgudError(`Invalid PR number: ${value}.`);
  }

  return number;
}

function renderPrTable(prs: PullRequest[], emptyMessage: string): void {
  output.renderTable(
    prs.map((pr) => ({
      title: pr.title,
      head: pr.head.ref,
      base: pr.base.ref,
      number: `#${pr.number}`,
      updated: pr.updated_at ?? "-",
      author: pr.user?.login ?? "-",
      draft: pr.draft ? "yes" : "no",
      state: pr.merged ? "merged" : pr.state,
    })),

    { emptyMessage },
  );
}

async function repositorySettings(
  repo: string,
): Promise<RepositoryMergeSettings> {
  const response = await api.repository(repo);

  return (await response.json()) as RepositoryMergeSettings;
}

const create = async (
  repo: string,
  options: {
    title: string;
    body?: string;
    base?: string;
    head?: string;
    draft?: boolean;
  },
) => {
  const settings = options.base ? undefined : await repositorySettings(repo);
  const base = options.base ?? settings?.default_branch;
  const head = options.head ?? git.getCurrentBranch();

  if (!base) {
    throw new GhitgudError("Repository does not include a default branch.");
  }

  if (!head) {
    throw new GhitgudError("Could not infer the current branch.");
  }

  logger.start(`Creating pull request from ${head} into ${base}.`);

  const pullRequest = await api.createPr(repo, {
    base,
    head,
    body: options.body,
    title: options.title,
    draft: options.draft ?? false,
  });

  logger.success(`Created pull request #${pullRequest.number}.`);

  output.renderSummary("Pull Request Created", [
    ["Number", `#${pullRequest.number}`],
    ["Title", pullRequest.title],
    ["State", pullRequest.draft ? "draft" : pullRequest.state],
    ["URL", pullRequest.html_url ?? "-"],
  ]);

  return { success: true, pullRequest };
};

const list = async (repo: string, options: PullRequestListOptions = {}) => {
  const limit = options.limit ?? 10;
  if (limit > 100) throw new GhitgudError("PR list limit cannot exceed 100.");

  const state = options.state ?? "open";
  logger.start(`Loading ${state} pull requests from ${repo}.`);

  const response = await api.list(repo, {
    state,
    limit,
    base: options.base,
    head: options.head,
  });

  let pullRequests = (await response.json()) as PullRequest[];

  if (state === "merged") {
    pullRequests = pullRequests.filter((pr) =>
      Boolean(pr.merged_at ?? pr.merged),
    );
  }

  renderPrTable(pullRequests, "No matching pull requests found.");
  logger.success(`Loaded ${pullRequests.length} pull request(s).`);

  return { success: true, pullRequests };
};

const view = async (repo: string, value: string | number) => {
  const number = parsePrNumber(value);
  logger.start(`Loading pull request #${number}.`);

  const pullRequest = await api.fetch(number, repo);

  output.renderSummary(`Pull Request #${number}`, [
    ["Title", pullRequest.title],

    [
      "State",
      pullRequest.merged
        ? "merged"
        : pullRequest.draft
          ? "draft"
          : pullRequest.state,
    ],

    ["Author", pullRequest.user?.login ?? "-"],
    ["Head", pullRequest.head.ref],
    ["Base", pullRequest.base.ref],

    [
      "Mergeable",
      pullRequest.mergeable === null
        ? "unknown"
        : pullRequest.mergeable
          ? "yes"
          : "no",
    ],

    ["Merge State", pullRequest.mergeable_state ?? "-"],

    [
      "Reviewers",
      pullRequest.requested_reviewers?.map((user) => user.login).join(", ") ||
        "-",
    ],

    [
      "Labels",
      pullRequest.labels?.map((label) => label.name).join(", ") || "-",
    ],

    ["Created", pullRequest.created_at ?? "-"],
    ["Updated", pullRequest.updated_at ?? "-"],
    ["URL", pullRequest.html_url ?? "-"],
  ]);

  output.renderSection("Body");
  output.log(pullRequest.body || "No body provided.");
  return { success: true, pullRequest };
};

const edit = async (
  repo: string,
  value: string | number,
  options: {
    title?: string;
    body?: string;
    base?: string;
    removeBody?: boolean;
  },
) => {
  const number = parsePrNumber(value);
  if (options.body !== undefined && options.removeBody) {
    throw new GhitgudError("Use either --body or --remove-body, not both.");
  }

  if (
    options.title === undefined &&
    options.body === undefined &&
    options.base === undefined &&
    !options.removeBody
  ) {
    throw new GhitgudError(
      "Provide --title, --body, --base, or --remove-body.",
    );
  }

  logger.start(`Editing pull request #${number}.`);

  const pullRequest = await api.updatePr(repo, number, {
    ...(options.title !== undefined ? { title: options.title } : {}),
    ...(options.base !== undefined ? { base: options.base } : {}),
    ...(options.body !== undefined
      ? { body: options.body }
      : options.removeBody
        ? { body: "" }
        : {}),
  });

  logger.success(`Edited pull request #${number}.`);
  return { success: true, pullRequest };
};

const setState = async (
  repo: string,
  value: string | number,
  state: "open" | "closed",
) => {
  const number = parsePrNumber(value);
  logger.start(
    `${state === "closed" ? "Closing" : "Reopening"} pull request #${number}.`,
  );

  const pullRequest = await api.updatePr(repo, number, { state });

  logger.success(
    `Pull request #${number} ${state === "closed" ? "closed" : "reopened"}.`,
  );

  return { success: true, pullRequest };
};

function selectMergeMethod(
  settings: RepositoryMergeSettings,
  requested?: "merge" | "squash" | "rebase",
): "merge" | "squash" | "rebase" {
  const enabled = {
    merge: settings.allow_merge_commit,
    squash: settings.allow_squash_merge,
    rebase: settings.allow_rebase_merge,
  };

  if (requested) {
    if (!(requested in enabled)) {
      throw new GhitgudError(`Invalid merge strategy: ${requested}.`);
    }

    if (!enabled[requested]) {
      throw new GhitgudError(
        `Repository does not allow the ${requested} merge strategy.`,
      );
    }

    return requested;
  }

  if (settings.allow_merge_commit) return "merge";
  if (settings.allow_squash_merge) return "squash";
  if (settings.allow_rebase_merge) return "rebase";
  throw new GhitgudError("Repository does not allow any merge strategy.");
}

const merge = async (
  repo: string,
  value: string | number,
  options: { method?: "merge" | "squash" | "rebase"; deleteBranch?: boolean },
) => {
  const number = parsePrNumber(value);
  const [pullRequest, settings] = await Promise.all([
    api.fetch(number, repo),
    repositorySettings(repo),
  ]);

  const method = selectMergeMethod(settings, options.method);
  logger.start(`Merging pull request #${number} with ${method}.`);

  const response = await api.merge(repo, number, method);
  const result = (await response.json()) as {
    merged?: boolean;
    message?: string;
    sha?: string;
  };

  if (!result.merged) {
    throw new GhitgudError(
      result.message || `Pull request #${number} was not merged.`,
    );
  }

  let branchDeleted = false;
  if (options.deleteBranch && pullRequest.head.repo?.full_name === repo) {
    await api.deleteBranch(repo, pullRequest.head.ref);
    branchDeleted = true;
  }

  logger.success(`Merged pull request #${number}.`);
  return {
    success: true,
    metadata: { number, method, branchDeleted, sha: result.sha },
  };
};

const checkout = async (repo: string, value: string | number) => {
  const number = parsePrNumber(value);
  if (!git.isWorkingTreeClean()) {
    throw new GhitgudError(
      "Working tree must be clean before checking out a pull request.",
    );
  }

  const pullRequest = await api.fetch(number, repo);
  logger.start(
    `Fetching pull request #${number} into ${pullRequest.head.ref}.`,
  );

  git.fetchPullRequest("origin", number, pullRequest.head.ref);
  git.checkoutBranch(pullRequest.head.ref);

  logger.success(
    `Checked out pull request #${number} on ${pullRequest.head.ref}.`,
  );

  return { success: true, metadata: { number, branch: pullRequest.head.ref } };
};

const diff = async (repo: string, value: string | number) => {
  const number = parsePrNumber(value);
  logger.start(`Loading diff for pull request #${number}.`);

  const response = await api.diff(repo, number);
  const patch = await response.text();
  output.log(patch || "No diff found.");

  return { success: true, number, diff: patch };
};

const checks = async (repo: string, value: string | number) => {
  const number = parsePrNumber(value);
  const pullRequest = await api.fetch(number, repo);
  const sha = pullRequest.head.sha;

  if (!sha) {
    throw new GhitgudError(
      `Pull request #${number} does not include a head SHA.`,
    );
  }

  logger.start(`Loading checks for pull request #${number}.`);

  const [runsResponse, statusResponse] = await Promise.all([
    api.checkRuns(repo, sha),
    api.combinedStatus(repo, sha),
  ]);

  const runs = (await runsResponse.json()) as {
    check_runs?: Array<{
      name: string;
      status: string;
      details_url?: string;
      conclusion: string | null;
    }>;
  };

  const statuses = (await statusResponse.json()) as {
    statuses?: Array<{
      state: string;
      context: string;
      description?: string | null;
      target_url?: string | null;
    }>;
  };

  const checkResults = [
    ...(runs.check_runs ?? []).map((run) => ({
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      detailsUrl: run.details_url ?? null,
    })),

    ...(statuses.statuses ?? []).map((status) => ({
      name: status.context,
      status: status.state,
      conclusion: status.state,
      detailsUrl: status.target_url ?? null,
    })),
  ];

  const failed = checkResults.some((check) =>
    ["failure", "error", "cancelled", "timed_out", "action_required"].includes(
      check.conclusion ?? check.status,
    ),
  );

  const pending =
    checkResults.length === 0 ||
    checkResults.some((check) =>
      ["queued", "in_progress", "pending", "requested", "expected"].includes(
        check.status,
      ),
    );

  const overall = failed ? "fail" : pending ? "pending" : "pass";

  output.renderTable(
    checkResults.map((check) => ({
      name: check.name,
      status: check.status,
      url: check.detailsUrl ?? "-",
      conclusion: check.conclusion ?? "-",
    })),

    { emptyMessage: "No checks found." },
  );

  logger.success(`Checks loaded: ${overall}.`);

  return {
    success: true,
    metadata: { number, sha, overall, checks: checkResults },
  };
};

const comment = async (repo: string, value: string | number, body: string) => {
  const number = parsePrNumber(value);
  logger.start(`Commenting on pull request #${number}.`);

  const response = await api.comment(repo, number, body);
  const prComment = (await response.json()) as Record<string, unknown>;
  logger.success(`Commented on pull request #${number}.`);

  return { success: true, comment: prComment };
};

const setLocked = async (
  repo: string,
  value: string | number,
  locked: boolean,
) => {
  const number = parsePrNumber(value);
  logger.start(`${locked ? "Locking" : "Unlocking"} pull request #${number}.`);

  await (locked ? api.lock(repo, number) : api.unlock(repo, number));
  logger.success(`Pull request #${number} ${locked ? "locked" : "unlocked"}.`);
  return { success: true, metadata: { number, locked } };
};

const ready = async (repo: string, value: string | number) => {
  const number = parsePrNumber(value);
  const pullRequest = await api.fetch(number, repo);

  if (!pullRequest.draft) {
    throw new GhitgudError(`Pull request #${number} is not a draft.`);
  }

  logger.start(`Marking pull request #${number} ready for review.`);

  const response = await api.ready(repo, number);
  const updated = (await response.json()) as PullRequest;
  logger.success(`Pull request #${number} is ready for review.`);

  return { success: true, pullRequest: updated };
};

const status = async (repo?: string) => {
  logger.start("Loading pull request status.");

  const [createdResponse, reviewsResponse] = await Promise.all([
    api.status("author:@me", repo),
    api.status("review-requested:@me", repo),
  ]);

  const read = async (response: Response) => {
    const items = ((await response.json()) as SearchPayload).items ?? [];

    return items.filter(
      (item, index) =>
        items.findIndex((candidate) => candidate.id === item.id) === index,
    );
  };

  const result = {
    created: await read(createdResponse),
    reviewRequests: await read(reviewsResponse),
  };

  for (const [title, items] of Object.entries(result)) {
    output.renderSection(title === "created" ? "Created" : "Review Requests");

    output.renderTable(
      items.map((item) => ({
        title: item.title ?? "-",
        url: item.html_url ?? "-",
        author: item.user?.login ?? "-",
        updated: item.updated_at ?? "-",
        number: item.number ? `#${item.number}` : "-",
      })),

      {
        emptyMessage: `No open ${title === "created" ? "created pull requests" : "review requests"} found.`,
      },
    );
  }

  logger.success("Pull request status loaded.");
  return { success: true, metadata: result };
};

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
  create,
  list,
  view,
  edit,
  diff,
  push,
  merge,
  checks,
  ready,
  status,
  comment,
  cleanup,
  checkout,

  close: (repo: string, value: string | number) =>
    setState(repo, value, "closed"),

  reopen: (repo: string, value: string | number) =>
    setState(repo, value, "open"),

  lock: (repo: string, value: string | number) => setLocked(repo, value, true),

  unlock: (repo: string, value: string | number) =>
    setLocked(repo, value, false),
};
