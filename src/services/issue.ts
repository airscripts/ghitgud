import api from "@/api/issues";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import { IssueSummary, SubIssueSummary } from "@/types";

interface SubtaskOptions {
  body?: string;
  link?: string;
  title?: string;
  create?: boolean;
}

function parseIssueNumber(value: string | number): number {
  const issueNumber = Number(value);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new GhitgudError(`Invalid issue number: ${value}`);
  }

  return issueNumber;
}

async function fetchIssue(
  repo: string,
  issueNumber: number,
): Promise<IssueSummary> {
  const response = await api.get(issueNumber, repo);
  return (await response.json()) as IssueSummary;
}

async function linkSubIssue(repo: string, parent: number, child: number) {
  const childIssue = await fetchIssue(repo, child);
  if (!childIssue.id) {
    throw new GhitgudError(`Issue #${child} does not include an API id.`);
  }

  await api.addSubIssue(parent, childIssue.id, repo);
  logger.success(`Linked issue #${child} under issue #${parent}.`);

  output.renderSummary("Sub-Issue Linked", [
    ["Parent", `#${parent}`],
    ["Child", `#${child}`],
  ]);

  return {
    success: true,
    metadata: {
      parent,
      child,
    },
  };
}

const subtasks = async (
  repo: string,
  issue: string,
  options: SubtaskOptions = {},
) => {
  const parent = parseIssueNumber(issue);

  if (options.create && options.link) {
    throw new GhitgudError("Use either --create or --link, not both.");
  }

  if (options.create) {
    if (!options.title) {
      throw new GhitgudError("--title is required when using --create.");
    }

    logger.start(`Creating sub-issue for issue #${parent}.`);
    const response = await api.create(
      {
        body: options.body,
        title: options.title,
      },

      repo,
    );

    const child = (await response.json()) as IssueSummary;
    if (!child.number) {
      throw new GhitgudError("Created issue did not include a number.");
    }

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

    {
      emptyMessage: "No sub-issues found.",
    },
  );

  return { success: true, subIssues };
};

const parent = async (
  repo: string,
  childValue: string,
  options: { parent?: string },
) => {
  if (!options.parent) {
    throw new GhitgudError("--parent is required.");
  }

  const child = parseIssueNumber(childValue);
  const parentIssue = parseIssueNumber(options.parent);
  logger.start(`Linking issue #${child} under issue #${parentIssue}.`);
  return linkSubIssue(repo, parentIssue, child);
};

export default {
  parent,
  subtasks,
};
