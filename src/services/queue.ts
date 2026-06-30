import api from "@/api/queue";
import reposApi from "@/api/repos";
import rulesetsApi from "@/api/rulesets";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";

interface GraphPayload {
  errors?: Array<{ message: string }>;
  data?: Record<string, unknown>;
}

const readGraph = async (
  response: Response,
): Promise<Record<string, unknown>> => {
  const payload = (await response.json()) as GraphPayload;
  if (payload.errors?.length) throw new GhitgudError(payload.errors[0].message);
  return payload.data ?? {};
};

const resolveBranch = async (repo: string, branch?: string): Promise<string> =>
  branch ?? (await reposApi.get(repo)).default_branch;

const getQueue = async (repo: string, branch?: string) => {
  const selectedBranch = await resolveBranch(repo, branch);
  const data = await readGraph(await api.get(repo, selectedBranch));
  const repository = data.repository as {
    mergeQueue?: Record<string, unknown> | null;
  } | null;
  return { branch: selectedBranch, queue: repository?.mergeQueue ?? null };
};

const normalizeEntries = (queue: Record<string, unknown> | null) => {
  const entries = queue?.entries as
    | { nodes?: Array<Record<string, unknown>>; totalCount?: number }
    | undefined;
  return (entries?.nodes ?? []).map((entry) => {
    const pullRequest = entry.pullRequest as Record<string, unknown> | null;
    const enqueuer = entry.enqueuer as { login?: string } | null;
    return {
      id: String(entry.id),
      position: Number(entry.position),
      state: String(entry.state),
      enqueuedAt: String(entry.enqueuedAt),
      estimatedTimeToMerge:
        entry.estimatedTimeToMerge === null
          ? null
          : Number(entry.estimatedTimeToMerge),
      enqueuer: enqueuer?.login ?? null,
      pullRequest: pullRequest
        ? {
            id: String(pullRequest.id),
            number: Number(pullRequest.number),
            title: String(pullRequest.title),
            url: String(pullRequest.url),
            head: String(pullRequest.headRefName),
            base: String(pullRequest.baseRefName),
          }
        : null,
    };
  });
};

const list = async (repo: string, options: { branch?: string } = {}) => {
  const result = await getQueue(repo, options.branch);
  const entries = normalizeEntries(result.queue);
  output.renderTable(
    entries.map((entry) => ({
      position: entry.position,
      pr: entry.pullRequest ? `#${entry.pullRequest.number}` : "-",
      title: entry.pullRequest?.title ?? "-",
      state: entry.state,
      enqueuedBy: entry.enqueuer ?? "-",
      etaSeconds: entry.estimatedTimeToMerge ?? "-",
    })),
    { emptyMessage: "No pull requests are currently queued." },
  );
  return {
    success: true,
    repo,
    branch: result.branch,
    configured: result.queue !== null,
    entries,
  };
};

const status = async (repo: string, options: { branch?: string } = {}) => {
  const result = await getQueue(repo, options.branch);
  if (!result.queue) {
    output.renderSummary("Merge Queue", [
      ["Repository", repo],
      ["Branch", result.branch],
      ["Configured", "no"],
    ]);
    return {
      success: true,
      repo,
      branch: result.branch,
      configured: false,
      entries: 0,
      configuration: null,
      requiredChecks: [],
    };
  }
  const entries = normalizeEntries(result.queue);
  const rulesResponse = await rulesetsApi.checkBranch(repo, result.branch);
  const rules = (await rulesResponse.json()) as Array<Record<string, unknown>>;
  const requiredChecks = rules
    .filter((rule) => rule.type === "required_status_checks")
    .flatMap((rule) => {
      const parameters = rule.parameters as
        | { required_status_checks?: Array<{ context?: string }> }
        | undefined;
      return (parameters?.required_status_checks ?? [])
        .map((check) => check.context)
        .filter((check): check is string => Boolean(check));
    });
  const configuration = result.queue.configuration as Record<
    string,
    unknown
  > | null;
  output.renderSummary("Merge Queue", [
    ["Repository", repo],
    ["Branch", result.branch],
    ["Configured", "yes"],
    ["Entries", entries.length],
    ["Required Checks", requiredChecks.join(", ") || "none"],
    ["Next ETA", String(result.queue.nextEntryEstimatedTimeToMerge ?? "-")],
  ]);
  return {
    success: true,
    repo,
    branch: result.branch,
    configured: true,
    entries: entries.length,
    configuration,
    requiredChecks,
  };
};

const resolvePullRequest = async (repo: string, number: number) => {
  const data = await readGraph(await api.pullRequest(repo, number));
  const repository = data.repository as {
    pullRequest?: Record<string, unknown> | null;
  } | null;
  const pullRequest = repository?.pullRequest;
  if (!pullRequest)
    throw new GhitgudError(`Pull request ${repo}#${number} was not found.`);
  return pullRequest;
};

const add = async (repo: string, number: number) => {
  const pullRequest = await resolvePullRequest(repo, number);
  if (pullRequest.mergeQueueEntry) {
    throw new GhitgudError(
      `Pull request #${number} is already in the merge queue.`,
    );
  }
  const data = await readGraph(
    await api.enqueue(String(pullRequest.id), String(pullRequest.headRefOid)),
  );
  const entry = (data.enqueuePullRequest as { mergeQueueEntry?: unknown })
    .mergeQueueEntry;
  logger.success(`Added pull request #${number} to the merge queue.`);
  return { success: true, repo, pullRequest: number, entry };
};

const remove = async (repo: string, number: number) => {
  const pullRequest = await resolvePullRequest(repo, number);
  if (!pullRequest.mergeQueueEntry) {
    throw new GhitgudError(
      `Pull request #${number} is not in the merge queue.`,
    );
  }
  const data = await readGraph(await api.dequeue(String(pullRequest.id)));
  const entry = (data.dequeuePullRequest as { mergeQueueEntry?: unknown })
    .mergeQueueEntry;
  logger.success(`Removed pull request #${number} from the merge queue.`);
  return { success: true, repo, pullRequest: number, entry };
};

const history = async (
  repo: string,
  options: { branch?: string; limit: number },
) => {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  ) {
    throw new GhitgudError("Queue history limit must be between 1 and 100.");
  }
  const branch = await resolveBranch(repo, options.branch);
  const data = await readGraph(await api.history(repo, branch, options.limit));
  const repository = data.repository as {
    pullRequests?: { nodes?: Array<Record<string, unknown>> };
  } | null;
  const events = (repository?.pullRequests?.nodes ?? [])
    .flatMap((pullRequest) => {
      const timeline = pullRequest.timelineItems as
        | { nodes?: Array<Record<string, unknown>> }
        | undefined;
      return (timeline?.nodes ?? []).map((event) => {
        const actor = event.actor as { login?: string } | null;
        return {
          id: String(event.id),
          action:
            event.__typename === "AddedToMergeQueueEvent" ? "added" : "removed",
          createdAt: String(event.createdAt),
          actor: actor?.login ?? null,
          reason: event.reason ? String(event.reason) : null,
          pullRequest: {
            number: Number(pullRequest.number),
            title: String(pullRequest.title),
            url: String(pullRequest.url),
          },
        };
      });
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, options.limit);
  output.renderTable(
    events.map((event) => ({
      action: event.action,
      pr: `#${event.pullRequest.number}`,
      title: event.pullRequest.title,
      actor: event.actor ?? "-",
      createdAt: event.createdAt,
      reason: event.reason ?? "-",
    })),
    { emptyMessage: "No recent merge queue activity found." },
  );
  return { success: true, repo, branch, events };
};

export default { list, status, add, remove, history };
