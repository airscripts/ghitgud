import api from "@/api/issues";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GhitgudError } from "@/core/errors";
import { IssueSummary, SubIssueSummary } from "@/types";

interface SubtaskOptions {
  body?: string;
  link?: string;
  title?: string;
  create?: boolean;
}

interface SearchPayload {
  items?: IssueSummary[];
}

interface GraphQlPayload {
  errors?: Array<{ message: string }>;

  data?: {
    repository?: { issue?: { isPinned?: boolean } | null } | null;
    transferIssue?: { issue?: { number: number; title: string; url: string } };
  };
}

interface IssueType {
  name: string;
  color?: string;
  description?: string;
}

function parseIssueNumber(value: string | number): number {
  const issueNumber = Number(value);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new GhitgudError(`Invalid issue number: ${value}`);
  }
  return issueNumber;
}

function labels(issue: IssueSummary): string {
  return (
    (issue.labels ?? [])
      .map((label) => (typeof label === "string" ? label : (label.name ?? "")))
      .filter(Boolean)
      .join(", ") || "-"
  );
}

function assignees(issue: IssueSummary): string {
  return issue.assignees?.map((user) => user.login).join(", ") || "-";
}

function issueType(issue: IssueSummary): string {
  if (typeof issue.type === "string") return issue.type;
  return issue.type?.name ?? "-";
}

function renderIssueTable(issues: IssueSummary[], emptyMessage: string): void {
  output.renderTable(
    issues.map((issue) => ({
      title: issue.title,
      labels: labels(issue),
      type: issueType(issue),
      state: issue.state ?? "-",
      assignees: assignees(issue),
      updated: issue.updated_at ?? "-",
      author: issue.user?.login ?? "-",
      number: issue.number ? `#${issue.number}` : "-",
    })),

    { emptyMessage },
  );
}

async function fetchIssue(repo: string, issueNumber: number) {
  const response = await api.get(issueNumber, repo);
  return (await response.json()) as IssueSummary;
}

function requireNodeId(issue: IssueSummary, issueNumber: number): string {
  if (!issue.node_id) {
    throw new GhitgudError(`Issue #${issueNumber} does not include a node id.`);
  }

  return issue.node_id;
}

async function readGraphQl(response: Response): Promise<GraphQlPayload> {
  const payload = (await response.json()) as GraphQlPayload;
  if (payload.errors?.length) throw new GhitgudError(payload.errors[0].message);
  return payload;
}

async function resolveType(repo: string, requested?: string) {
  if (!requested) return undefined;
  const response = await api.issueTypes(repo);
  const types = (await response.json()) as IssueType[];

  const matches = types.filter(
    (type) => type.name.toLowerCase() === requested.toLowerCase(),
  );

  if (matches.length !== 1) {
    const available = types.map((type) => type.name).join(", ") || "none";

    throw new GhitgudError(
      `Issue type "${requested}" was not found. Available: ${available}.`,
    );
  }

  return matches[0].name;
}

const create = async (
  repo: string,
  options: {
    title: string;
    body?: string;
    type?: string;
    labels?: string[];
    assignees?: string[];
  },
) => {
  logger.start(`Creating issue in ${repo}.`);
  const type = await resolveType(repo, options.type);
  const response = await api.create({ ...options, type }, repo);
  const issue = (await response.json()) as IssueSummary;
  logger.success(`Created issue #${issue.number}.`);

  output.renderSummary("Issue Created", [
    ["Number", issue.number ? `#${issue.number}` : "-"],
    ["Title", issue.title],
    ["State", issue.state ?? "open"],
    ["URL", issue.html_url ?? issue.url ?? "-"],
  ]);

  return { success: true, issue };
};

const list = async (
  repo: string,
  options: {
    limit?: number;
    labels?: string[];
    assignees?: string[];
    state?: "open" | "closed" | "all";
  },
) => {
  if ((options.limit ?? 10) > 100) {
    throw new GhitgudError("Issue list limit cannot exceed 100.");
  }

  logger.start(`Loading issues from ${repo}.`);
  const response = await api.list(repo, options);
  const payload = (await response.json()) as SearchPayload;
  const issues = payload.items ?? [];

  renderIssueTable(issues, "No matching issues found.");
  logger.success(`Loaded ${issues.length} issue(s).`);
  return { success: true, issues };
};

const view = async (repo: string, value: string | number) => {
  const number = parseIssueNumber(value);
  logger.start(`Loading issue #${number}.`);

  const [issue, pinResponse] = await Promise.all([
    fetchIssue(repo, number),
    api.pinState(number, repo),
  ]);

  const pinPayload = await readGraphQl(pinResponse);
  const pinned = pinPayload.data?.repository?.issue?.isPinned ?? false;

  output.renderSummary(`Issue #${number}`, [
    ["Title", issue.title],
    ["State", issue.state ?? "-"],
    ["Author", issue.user?.login ?? "-"],
    ["Assignees", assignees(issue)],
    ["Labels", labels(issue)],
    ["Type", issueType(issue)],
    ["Locked", issue.locked ? "yes" : "no"],
    ["Pinned", pinned ? "yes" : "no"],
    ["Created", issue.created_at ?? "-"],
    ["Updated", issue.updated_at ?? "-"],
    ["URL", issue.html_url ?? issue.url ?? "-"],
  ]);

  output.renderSection("Body");
  output.log(issue.body || "No body provided.");
  return { success: true, issue: { ...issue, isPinned: pinned } };
};

const edit = async (
  repo: string,
  value: string | number,
  options: { title?: string; body?: string; removeBody?: boolean },
) => {
  const number = parseIssueNumber(value);

  if (options.body !== undefined && options.removeBody) {
    throw new GhitgudError("Use either --body or --remove-body, not both.");
  }

  if (
    options.title === undefined &&
    options.body === undefined &&
    !options.removeBody
  ) {
    throw new GhitgudError("Provide --title, --body, or --remove-body.");
  }

  logger.start(`Editing issue #${number}.`);

  const response = await api.update(
    number,
    {
      ...(options.title !== undefined ? { title: options.title } : {}),
      ...(options.body !== undefined
        ? { body: options.body }
        : options.removeBody
          ? { body: "" }
          : {}),
    },

    repo,
  );

  const issue = (await response.json()) as IssueSummary;
  logger.success(`Edited issue #${number}.`);
  return { success: true, issue };
};

const setState = async (
  repo: string,
  value: string | number,
  state: "open" | "closed",
) => {
  const number = parseIssueNumber(value);

  logger.start(
    `${state === "closed" ? "Closing" : "Reopening"} issue #${number}.`,
  );

  const response = await api.update(number, { state }, repo);
  const issue = (await response.json()) as IssueSummary;

  logger.success(
    `Issue #${number} ${state === "closed" ? "closed" : "reopened"}.`,
  );

  return { success: true, issue };
};

const comment = async (repo: string, value: string | number, body: string) => {
  const number = parseIssueNumber(value);
  logger.start(`Commenting on issue #${number}.`);
  const response = await api.comment(number, body, repo);

  const issueComment = (await response.json()) as Record<string, unknown>;
  logger.success(`Commented on issue #${number}.`);
  return { success: true, comment: issueComment };
};

const lock = async (repo: string, value: string | number, locked: boolean) => {
  const number = parseIssueNumber(value);
  logger.start(`${locked ? "Locking" : "Unlocking"} issue #${number}.`);
  await (locked ? api.lock(number, repo) : api.unlock(number, repo));

  logger.success(`Issue #${number} ${locked ? "locked" : "unlocked"}.`);
  return { success: true, metadata: { number, locked } };
};

const nodeMutation = async (
  repo: string,
  value: string | number,
  action: "delete" | "pin" | "unpin",
) => {
  const number = parseIssueNumber(value);
  const issue = await fetchIssue(repo, number);

  logger.start(
    `${action === "delete" ? "Deleting" : action === "pin" ? "Pinning" : "Unpinning"} issue #${number}.`,
  );

  await readGraphQl(await api[action](requireNodeId(issue, number)));

  logger.success(
    `Issue #${number} ${action === "delete" ? "deleted" : action === "pin" ? "pinned" : "unpinned"}.`,
  );

  return { success: true, metadata: { number } };
};

const transfer = async (
  repo: string,
  value: string | number,
  targetRepo: string,
) => {
  const number = parseIssueNumber(value);

  const [issue, repositoryResponse] = await Promise.all([
    fetchIssue(repo, number),
    api.repository(targetRepo),
  ]);

  const repository = (await repositoryResponse.json()) as { node_id?: string };
  if (!repository.node_id) {
    throw new GhitgudError(
      `Repository ${targetRepo} does not include a node id.`,
    );
  }

  logger.start(`Transferring issue #${number} to ${targetRepo}.`);
  const payload = await readGraphQl(
    await api.transfer(requireNodeId(issue, number), repository.node_id),
  );

  const transferred = payload.data?.transferIssue?.issue;
  if (!transferred) throw new GhitgudError("Transfer did not return an issue.");
  logger.success(`Transferred issue to ${targetRepo}#${transferred.number}.`);
  return { success: true, issue: transferred };
};

const status = async (repo?: string) => {
  logger.start("Loading issue status.");

  const [assignedResponse, createdResponse, mentionedResponse] =
    await Promise.all([
      api.status("assignee:@me", repo),
      api.status("author:@me", repo),
      api.status("mentions:@me", repo),
    ]);

  const readItems = async (response: Response) =>
    (((await response.json()) as SearchPayload).items ?? []).filter(
      (issue, index, all) =>
        all.findIndex((candidate) => candidate.id === issue.id) === index,
    );

  const result = {
    assigned: await readItems(assignedResponse),
    created: await readItems(createdResponse),
    mentioned: await readItems(mentionedResponse),
  };

  for (const [title, issues] of Object.entries(result)) {
    output.renderSection(title[0].toUpperCase() + title.slice(1));
    renderIssueTable(issues, `No ${title} open issues found.`);
  }

  logger.success("Issue status loaded.");
  return { success: true, metadata: result };
};

async function linkSubIssue(repo: string, parent: number, child: number) {
  const childIssue = await fetchIssue(repo, child);
  if (!childIssue.id)
    throw new GhitgudError(`Issue #${child} does not include an API id.`);
  await api.addSubIssue(parent, childIssue.id, repo);
  logger.success(`Linked issue #${child} under issue #${parent}.`);
  output.renderSummary("Sub-Issue Linked", [
    ["Parent", `#${parent}`],
    ["Child", `#${child}`],
  ]);
  return { success: true, metadata: { parent, child } };
}

const subtasks = async (
  repo: string,
  issue: string,
  options: SubtaskOptions = {},
) => {
  const parent = parseIssueNumber(issue);
  if (options.create && options.link)
    throw new GhitgudError("Use either --create or --link, not both.");
  if (options.create) {
    if (!options.title)
      throw new GhitgudError("--title is required when using --create.");
    logger.start(`Creating sub-issue for issue #${parent}.`);
    const response = await api.create(
      { body: options.body, title: options.title },
      repo,
    );
    const child = (await response.json()) as IssueSummary;
    if (!child.number)
      throw new GhitgudError("Created issue did not include a number.");
    return linkSubIssue(repo, parent, child.number);
  }
  if (options.link) {
    logger.start(`Linking sub-issue to issue #${parent}.`);
    return linkSubIssue(repo, parent, parseIssueNumber(options.link));
  }
  logger.start(`Loading sub-issues for issue #${parent}.`);
  const response = await api.listSubIssues(parent, repo);
  const subIssues = (await response.json()) as SubIssueSummary[];
  output.renderTable(
    subIssues.map((subIssue) => ({
      title: subIssue.title,
      state: subIssue.state ?? "-",
      url: subIssue.html_url ?? subIssue.url ?? "-",
      number: subIssue.number ? `#${subIssue.number}` : "-",
    })),
    { emptyMessage: "No sub-issues found." },
  );
  return { success: true, subIssues };
};

const parent = async (
  repo: string,
  childValue: string,
  options: { parent?: string },
) => {
  if (!options.parent) throw new GhitgudError("--parent is required.");
  const child = parseIssueNumber(childValue);
  const parentIssue = parseIssueNumber(options.parent);
  logger.start(`Linking issue #${child} under issue #${parentIssue}.`);
  return linkSubIssue(repo, parentIssue, child);
};

const typeList = async (options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading issue types for ${repo}.`);
  const response = await api.issueTypes(repo);
  const types = (await response.json()) as IssueType[];
  output.renderTable(
    types.map((t) => ({
      name: t.name,
      color: t.color ?? "-",
      description: t.description ?? "-",
    })),
    { emptyMessage: "No issue types configured." },
  );
  logger.success(`Loaded ${types.length} issue type(s).`);
  return { success: true, types };
};

export default {
  edit,
  list,
  view,
  status,
  parent,
  create,
  comment,
  transfer,
  subtasks,
  typeList,
  lock: (repo: string, issue: string | number) => lock(repo, issue, true),
  unlock: (repo: string, issue: string | number) => lock(repo, issue, false),

  close: (repo: string, issue: string | number) =>
    setState(repo, issue, "closed"),

  reopen: (repo: string, issue: string | number) =>
    setState(repo, issue, "open"),

  delete: (repo: string, issue: string | number) =>
    nodeMutation(repo, issue, "delete"),

  pin: (repo: string, issue: string | number) =>
    nodeMutation(repo, issue, "pin"),

  unpin: (repo: string, issue: string | number) =>
    nodeMutation(repo, issue, "unpin"),
};
