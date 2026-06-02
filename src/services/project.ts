import pc from "picocolors";

import api from "@/api/projects";
import config from "@/core/config";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import { ProjectBoard, ProjectBoardItem } from "@/types";

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

function getDefaultOwner(): string {
  const [owner] = config.getRepo().split("/");
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

const board = async (projectNumber: string, options: { owner?: string }) => {
  const number = Number(projectNumber);
  if (!Number.isInteger(number) || number <= 0) {
    throw new GhitgudError(`Invalid project id: ${projectNumber}`);
  }

  const owner = options.owner ?? getDefaultOwner();
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

export default {
  board,
};
