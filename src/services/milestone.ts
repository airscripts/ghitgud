import api from "@/api/milestones";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import { Milestone, MilestoneProgress, MilestoneState } from "@/types";

function parseDueDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new GhitgudError(`Invalid due date: ${value}`);
  }

  return date.toISOString();
}

function formatDueDate(value: string | null): string {
  if (!value) return "-";
  return value.slice(0, 10);
}

function calculateProgress(milestone: Milestone): MilestoneProgress {
  const total = milestone.open_issues + milestone.closed_issues;

  return {
    total,
    title: milestone.title,
    openIssues: milestone.open_issues,
    closedIssues: milestone.closed_issues,

    percent:
      total === 0 ? 0 : Math.round((milestone.closed_issues / total) * 100),
  };
}

async function fetchMilestones(state: MilestoneState): Promise<Milestone[]> {
  const response = await api.list(state);
  return (await response.json()) as Milestone[];
}

async function findByTitle(title: string): Promise<Milestone> {
  const milestones = [
    ...(await fetchMilestones("open")),
    ...(await fetchMilestones("closed")),
  ].filter((milestone) => milestone.title === title);

  if (milestones.length === 0) {
    throw new GhitgudError(`Milestone "${title}" was not found.`);
  }

  if (milestones.length > 1) {
    throw new GhitgudError(`Milestone "${title}" is ambiguous.`);
  }

  return milestones[0];
}

const create = async (options: { title: string; due: string }) => {
  logger.start(`Creating milestone "${options.title}".`);
  const response = await api.create({
    title: options.title,
    dueOn: parseDueDate(options.due),
  });

  const milestone = (await response.json()) as Milestone;

  logger.success(`Created milestone "${milestone.title}".`);
  output.renderSummary("Milestone Created", [
    ["Title", milestone.title],
    ["State", milestone.state],
    ["Due", formatDueDate(milestone.due_on)],
    ["URL", milestone.html_url],
  ]);

  return { success: true, milestone };
};

const list = async (options: { status?: MilestoneState }) => {
  const status = options.status ?? "open";
  logger.start(`Loading ${status} milestones.`);
  const milestones = await fetchMilestones(status);

  output.renderTable(
    milestones.map((milestone) => {
      const progress = calculateProgress(milestone);

      return {
        title: milestone.title,
        open: milestone.open_issues,
        closed: milestone.closed_issues,
        progress: `${progress.percent}%`,
        due: formatDueDate(milestone.due_on),
      };
    }),
    {
      emptyMessage: `No ${status} milestones found.`,
    },
  );

  return { success: true, milestones };
};

const close = async (title: string) => {
  logger.start(`Closing milestone "${title}".`);
  const milestone = await findByTitle(title);
  const response = await api.close(milestone.number);
  const closed = (await response.json()) as Milestone;

  logger.success(`Closed milestone "${closed.title}".`);
  output.renderSummary("Milestone Closed", [
    ["Title", closed.title],
    ["State", closed.state],
    ["URL", closed.html_url],
  ]);

  return { success: true, milestone: closed };
};

const progress = async (title: string) => {
  logger.start(`Loading progress for milestone "${title}".`);
  const milestone = await findByTitle(title);
  const metadata = calculateProgress(milestone);

  output.renderSummary("Milestone Progress", [
    ["Title", metadata.title],
    ["Progress", `${metadata.percent}%`],
    ["Open", metadata.openIssues],
    ["Closed", metadata.closedIssues],
    ["Total", metadata.total],
  ]);

  if (metadata.total === 0) {
    output.log("No issues assigned.");
  }

  return { success: true, metadata };
};

export default {
  create,
  list,
  close,
  progress,
};
