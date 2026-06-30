import pc from "picocolors";

import api from "@/api/projects";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import {
  ProjectBoard,
  ProjectBoardItem,
  ProjectField,
  ProjectItem,
  ProjectSummary,
} from "@/types";

interface ProjectContent {
  url?: string;
  type?: string;
  title?: string;
  state?: string;
  number?: number;
  __typename?: string;
}

interface ProjectNode {
  content?: ProjectContent | null;

  fieldValueByName?: {
    name?: string | null;
  } | null;
}

interface ProjectResponse {
  errors?: Array<{ message: string }>;

  data?: {
    user?: ProjectPayload | null;
    organization?: ProjectPayload | null;
  };
}

interface ProjectPayload {
  projectV2?: {
    title: string;

    items: {
      nodes: ProjectNode[];
    };
  } | null;
}

function getDefaultOwner(repo: string): string {
  const [owner] = repo.split("/");
  if (!owner) {
    throw new GhitgudError("Could not resolve project owner.");
  }

  return owner;
}

function getContentType(content: ProjectContent): string {
  if (content.type) return content.type;
  if (content.__typename === "PullRequest") return "PullRequest";
  if (content.__typename === "Issue") return "Issue";
  if (content.number) return "Issue";
  return "Draft";
}

function buildBoard(
  owner: string,
  number: number,
  project: NonNullable<ProjectPayload["projectV2"]>,
): ProjectBoard {
  const columns = new Map<string, ProjectBoardItem[]>();

  for (const node of project.items.nodes) {
    const content = node.content;
    if (!content?.title) continue;

    const status = node.fieldValueByName?.name ?? "No Status";
    const items = columns.get(status) ?? [];

    items.push({
      title: content.title,
      url: content.url,
      type: getContentType(content),
      state: content.state,
      number: content.number,
    });

    columns.set(status, items);
  }

  return {
    owner,
    number,
    title: project.title,

    columns: Array.from(columns.entries()).map(([name, items]) => ({
      name,
      items,
    })),
  };
}

function renderBoard(board: ProjectBoard) {
  output.renderSection(`${board.title} Board`);

  if (!board.columns.length) {
    output.log("No project items found.");
    return;
  }

  for (const column of board.columns) {
    output.log(pc.bold(`${column.name} (${column.items.length})`));

    if (!column.items.length) {
      output.log("  -");
      continue;
    }

    for (const item of column.items) {
      const number = item.number ? `#${item.number} ` : "";
      output.log(`  - ${number}${item.title}`);
    }
  }
}

const board = async (
  projectNumber: string,
  options: { repo?: string; owner?: string },
) => {
  const number = Number(projectNumber);
  if (!Number.isInteger(number) || number <= 0) {
    throw new GhitgudError(`Invalid project id: ${projectNumber}`);
  }

  const owner = options.owner ?? getDefaultOwner(options.repo ?? "");
  logger.start(`Loading project board ${owner}/${number}.`);

  const response = await api.board(owner, number);
  const payload = (await response.json()) as ProjectResponse;

  if (payload.errors?.length) {
    throw new GhitgudError(payload.errors[0].message);
  }

  const project =
    payload.data?.organization?.projectV2 ?? payload.data?.user?.projectV2;

  if (!project) {
    throw new GhitgudError(`Project ${owner}/${number} was not found.`);
  }

  const metadata = buildBoard(owner, number, project);
  renderBoard(metadata);

  return { success: true, board: metadata };
};

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

const resolveOwner = async (options: { owner?: string; repo?: string }) => {
  const requested = options.owner ?? options.repo?.split("/")[0] ?? "";
  const data = await readGraph(await api.owner(requested));
  const organization = data.organization as {
    id: string;
    login: string;
  } | null;
  const user = data.user as { id: string; login: string } | null;
  const viewer = data.viewer as { login: string } | undefined;
  const owner = organization ?? user;

  if (requested && !owner) {
    throw new GhitgudError(`Project owner not found: ${requested}.`);
  }

  if (owner) return owner;
  if (!viewer?.login)
    throw new GhitgudError("Could not resolve project owner.");

  const viewerData = await readGraph(await api.owner(viewer.login));
  const viewerOwner = viewerData.user as { id: string; login: string } | null;
  if (!viewerOwner) throw new GhitgudError("Could not resolve project owner.");
  return viewerOwner;
};

const normalizeProject = (
  project: Record<string, unknown>,
): ProjectSummary => ({
  id: String(project.id),
  number: Number(project.number),
  title: String(project.title),
  description: String(project.shortDescription ?? ""),
  closed: Boolean(project.closed),
  url: String(project.url ?? ""),
  updatedAt: project.updatedAt ? String(project.updatedAt) : undefined,
});

const getProject = async (
  value: string,
  options: { owner?: string; repo?: string; limit?: number } = {},
) => {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new GhitgudError(`Invalid project id: ${value}`);
  }
  const owner = await resolveOwner(options);
  const data = await readGraph(
    await api.get(owner.login, number, options.limit ?? 100),
  );
  const organization = data.organization as { projectV2?: unknown } | null;
  const user = data.user as { projectV2?: unknown } | null;
  const project = (organization?.projectV2 ?? user?.projectV2) as Record<
    string,
    unknown
  > | null;
  if (!project)
    throw new GhitgudError(`Project ${owner.login}/${number} was not found.`);
  return { owner: owner.login, project };
};

const list = async (options: {
  owner?: string;
  repo?: string;
  limit: number;
}) => {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  ) {
    throw new GhitgudError("Project limit must be between 1 and 100.");
  }
  const owner = await resolveOwner(options);
  const data = await readGraph(await api.list(owner.login, options.limit));
  const container = (data.organization ?? data.user) as
    | { projectsV2?: { nodes?: Array<Record<string, unknown>> } }
    | undefined;
  const projects = (container?.projectsV2?.nodes ?? []).map(normalizeProject);
  output.renderTable(
    projects.map((project) => ({
      number: project.number,
      title: project.title,
      closed: project.closed ? "yes" : "no",
      description: project.description || "-",
    })),
    { emptyMessage: "No projects found." },
  );
  return { success: true, owner: owner.login, projects };
};

const view = async (
  value: string,
  options: { owner?: string; repo?: string },
) => {
  const { owner, project } = await getProject(value, options);
  const metadata = normalizeProject(project);
  output.renderKeyValues([
    ["Number", metadata.number],
    ["Title", metadata.title],
    ["Description", metadata.description || "-"],
    ["Closed", metadata.closed ? "yes" : "no"],
    ["URL", metadata.url],
  ]);
  return { success: true, owner, project: metadata };
};

const create = async (
  title: string,
  options: { owner?: string; repo?: string },
) => {
  if (!title.trim()) throw new GhitgudError("Project title is required.");
  const owner = await resolveOwner(options);
  const data = await readGraph(await api.create(owner.id, title));
  const created = (
    data.createProjectV2 as { projectV2: Record<string, unknown> }
  ).projectV2;
  logger.success(`Created project ${owner.login}/${created.number}.`);
  return {
    success: true,
    owner: owner.login,
    project: normalizeProject(created),
  };
};

const edit = async (
  value: string,
  options: {
    owner?: string;
    repo?: string;
    title: string;
    description: string;
  },
) => {
  const { owner, project } = await getProject(value, options);
  const data = await readGraph(
    await api.update(String(project.id), {
      title: options.title,
      shortDescription: options.description,
    }),
  );
  const updated = (
    data.updateProjectV2 as { projectV2: Record<string, unknown> }
  ).projectV2;
  logger.success(`Updated project ${owner}/${value}.`);
  return { success: true, owner, project: normalizeProject(updated) };
};

const close = async (
  value: string,
  options: { owner?: string; repo?: string },
) => {
  const { owner, project } = await getProject(value, options);
  await readGraph(await api.update(String(project.id), { closed: true }));
  logger.success(`Closed project ${owner}/${value}.`);
  return { success: true, owner, project: Number(value), closed: true };
};

const remove = async (
  value: string,
  options: { owner?: string; repo?: string },
) => {
  const { owner, project } = await getProject(value, options);
  await readGraph(await api.delete(String(project.id)));
  logger.success(`Deleted project ${owner}/${value}.`);
  return { success: true, owner, project: Number(value) };
};

const normalizeItems = (project: Record<string, unknown>): ProjectItem[] => {
  const items = project.items as
    | { nodes?: Array<Record<string, unknown>> }
    | undefined;
  return (items?.nodes ?? []).map((node) => {
    const content = (node.content ?? {}) as Record<string, unknown>;
    const repository = content.repository as
      | { nameWithOwner?: string }
      | undefined;
    const status = node.fieldValueByName as { name?: string } | null;
    return {
      id: String(node.id),
      type: String(node.type ?? "UNKNOWN"),
      title: String(content.title ?? "Untitled"),
      status: status?.name ?? "No Status",
      state: content.state ? String(content.state) : undefined,
      number: content.number ? Number(content.number) : undefined,
      url: content.url ? String(content.url) : undefined,
      repository: repository?.nameWithOwner,
    };
  });
};

const itemList = async (
  value: string,
  options: { owner?: string; repo?: string; limit: number },
) => {
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > 100
  ) {
    throw new GhitgudError("Project item limit must be between 1 and 100.");
  }
  const { owner, project } = await getProject(value, options);
  const items = normalizeItems(project);
  output.renderTable(
    items.map((item) => ({
      type: item.type,
      title: item.title,
      status: item.status,
      repository: item.repository ?? "-",
      number: item.number ? `#${item.number}` : "-",
    })),
    { emptyMessage: "No project items found." },
  );
  return { success: true, owner, project: Number(value), items };
};

const itemAdd = async (
  value: string,
  issueNumber: number,
  options: { owner?: string; repo: string },
) => {
  const { owner, project } = await getProject(value, options);
  const issueData = await readGraph(await api.issue(options.repo, issueNumber));
  const repository = issueData.repository as { issue?: { id?: string } } | null;
  const issueId = repository?.issue?.id;
  if (!issueId)
    throw new GhitgudError(
      `Issue ${options.repo}#${issueNumber} was not found.`,
    );
  const data = await readGraph(await api.addItem(String(project.id), issueId));
  const item = (data.addProjectV2ItemById as { item?: { id?: string } }).item;
  return { success: true, owner, project: Number(value), itemId: item?.id };
};

const itemCreate = async (
  value: string,
  options: { owner?: string; repo?: string; title: string; body?: string },
) => {
  const { owner, project } = await getProject(value, options);
  const data = await readGraph(
    await api.createItem(String(project.id), options.title, options.body),
  );
  const item = (
    data.addProjectV2DraftIssue as { projectItem?: { id?: string } }
  ).projectItem;
  return { success: true, owner, project: Number(value), itemId: item?.id };
};

const fieldList = async (
  value: string,
  options: { owner?: string; repo?: string },
) => {
  const { owner, project } = await getProject(value, options);
  const connection = project.fields as { nodes?: ProjectField[] } | undefined;
  const fields = (connection?.nodes ?? []).filter(
    (field) => field.id && field.name,
  );
  output.renderTable(
    fields.map((field) => ({
      name: field.name,
      type: field.dataType,
      id: field.id,
    })),
    { emptyMessage: "No project fields found." },
  );
  return { success: true, owner, project: Number(value), fields };
};

const setLinked = async (
  value: string,
  repo: string,
  options: { owner?: string; repo?: string },
  linked: boolean,
) => {
  const { owner, project } = await getProject(value, options);
  const repoData = await readGraph(await api.repository(repo));
  const repository = repoData.repository as { id?: string } | null;
  if (!repository?.id) throw new GhitgudError(`Repository not found: ${repo}.`);
  await readGraph(
    await (linked
      ? api.link(String(project.id), repository.id)
      : api.unlink(String(project.id), repository.id)),
  );
  logger.success(`${linked ? "Linked" : "Unlinked"} ${repo}.`);
  return {
    success: true,
    owner,
    project: Number(value),
    repository: repo,
    linked,
  };
};

export default {
  board,
  list,
  view,
  create,
  edit,
  close,
  remove,
  itemList,
  itemAdd,
  itemCreate,
  fieldList,
  setLinked,
};
