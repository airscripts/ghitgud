import fs from "fs";
import path from "path";

import git from "@/core/git";
import output from "@/core/output";
import logger from "@/core/logger";

import {
  WORKFLOW_DEFAULT_DIR,
  ERROR_WORKFLOW_NOT_FOUND,
  WORKFLOW_FILE_EXTENSIONS,
  ERROR_WORKFLOW_INVALID_YAML,
} from "@/core/constants";

import {
  WorkflowDryRunJob,
  WorkflowDryRunResult,
  WorkflowValidateResult,
  WorkflowValidationIssue,
} from "@/types";

import { GhitgudError } from "@/core/errors";

function getWorkflowFiles(targetPath?: string): string[] {
  const repoRoot = git.getRepoRoot();

  if (targetPath) {
    const absolutePath = path.isAbsolute(targetPath)
      ? targetPath
      : path.join(repoRoot, targetPath);

    if (!fs.existsSync(absolutePath)) {
      throw new GhitgudError(ERROR_WORKFLOW_NOT_FOUND);
    }

    return [absolutePath];
  }

  const workflowDir = path.join(repoRoot, WORKFLOW_DEFAULT_DIR);
  if (!fs.existsSync(workflowDir)) {
    throw new GhitgudError(ERROR_WORKFLOW_NOT_FOUND);
  }

  const files = fs
    .readdirSync(workflowDir)
    .filter((file) =>
      WORKFLOW_FILE_EXTENSIONS.some((extension) => file.endsWith(extension)),
    )
    .map((file) => path.join(workflowDir, file));

  if (!files.length) {
    throw new GhitgudError(ERROR_WORKFLOW_NOT_FOUND);
  }

  return files;
}

function collectIssues(
  content: string,
  filePath: string,
): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  const lines = content.split("\n");

  const hasName = lines.some((line) => /^\s*name:\s*/.test(line));
  if (!hasName) {
    issues.push({
      file: filePath,
      level: "warning",
      rule: "workflow-name",
      message: "Workflow has no top-level name.",
    });
  }

  const onLine = lines.findIndex((line) => /^on:\s*|^"on":\s*/.test(line));
  if (onLine < 0) {
    issues.push({
      file: filePath,
      level: "error",
      rule: "workflow-trigger",
      message: "Workflow must declare an 'on' trigger.",
    });
  }

  const jobsLine = lines.findIndex((line) => /^jobs:\s*$/.test(line));
  if (jobsLine < 0) {
    issues.push({
      file: filePath,
      level: "error",
      rule: "workflow-jobs",
      message: "Workflow must declare a jobs block.",
    });
  }

  for (const [index, line] of lines.entries()) {
    if (line.includes("\t")) {
      issues.push({
        file: filePath,
        level: "error",
        line: index + 1,
        rule: "no-tabs",
        message: ERROR_WORKFLOW_INVALID_YAML,
      });
    }
  }

  return issues;
}

function parseDryRun(content: string, filePath: string): WorkflowDryRunResult {
  const lines = content.split("\n");
  const unresolvedExpressions = Array.from(
    new Set(
      (content.match(/\$\{\{[^}]+\}\}/g) ?? []).map((entry) => entry.trim()),
    ),
  );

  const workflowName =
    lines
      .map((line) => line.match(/^\s*name:\s*(.+)\s*$/))
      .find(Boolean)?.[1]
      ?.replace(/^["']|["']$/g, "") ?? null;

  const triggers = lines
    .map((line) => line.match(/^\s{2}([A-Za-z0-9_-]+):\s*$/))
    .filter((line) => line && lines.findIndex((v) => /^on:\s*$/.test(v)) >= 0)
    .map((line) => line?.[1] ?? "")
    .filter(Boolean);

  const jobs: WorkflowDryRunJob[] = [];
  let inJobs = false;
  let currentJob: WorkflowDryRunJob | null = null;
  let inMatrix = false;

  for (const line of lines) {
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true;
      continue;
    }

    if (!inJobs) continue;
    if (/^\S/.test(line) && !/^jobs:\s*$/.test(line)) break;

    const jobMatch = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*$/);
    if (jobMatch) {
      currentJob = {
        id: jobMatch[1],
        needs: [],
        runsOn: null,
        matrix: [],
      };

      jobs.push(currentJob);
      inMatrix = false;
      continue;
    }

    if (!currentJob) continue;

    const needsInline = line.match(/^\s{4}needs:\s*(.+)\s*$/);
    if (needsInline) {
      const raw = needsInline[1].trim();
      if (raw.startsWith("[")) {
        currentJob.needs = raw
          .replace(/[[\]"]/g, "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
      } else {
        currentJob.needs = [raw.replace(/["']/g, "").trim()];
      }
      continue;
    }

    const runsOn = line.match(/^\s{4}runs-on:\s*(.+)\s*$/);
    if (runsOn) {
      currentJob.runsOn = runsOn[1].trim();
      continue;
    }

    if (/^\s{6}matrix:\s*$/.test(line)) {
      inMatrix = true;
      continue;
    }

    if (inMatrix) {
      if (/^\s{8}[A-Za-z0-9_-]+:\s*\[(.+)\]\s*$/.test(line)) {
        const matrixMatch = line.match(
          /^\s{8}([A-Za-z0-9_-]+):\s*\[(.+)\]\s*$/,
        );

        if (matrixMatch) {
          currentJob.matrix.push(`${matrixMatch[1]}=[${matrixMatch[2]}]`);
        }

        continue;
      }

      if (!/^\s{8}/.test(line)) {
        inMatrix = false;
      }
    }
  }

  return {
    jobs,
    triggers,
    workflowName,
    file: filePath,
    unresolvedExpressions,
  };
}

const validate = async (targetPath?: string) => {
  logger.start("Validating workflow files.");
  const files = getWorkflowFiles(targetPath);

  const results: WorkflowValidateResult[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");

    const issues = collectIssues(content, file);
    results.push({
      file,
      issues,
      valid: !issues.some((issue) => issue.level === "error"),
    });
  }

  const totalIssues = results.reduce(
    (sum, item) => sum + item.issues.length,
    0,
  );

  const errorCount = results.reduce(
    (sum, item) =>
      sum + item.issues.filter((issue) => issue.level === "error").length,
    0,
  );

  output.renderSummary("Workflow Validation", [
    ["Files", results.length],
    ["Issues", totalIssues],
    ["Errors", errorCount],
  ]);

  for (const result of results) {
    output.renderSection(path.basename(result.file));

    output.renderTable(
      result.issues.map((issue) => ({
        rule: issue.rule,
        level: issue.level,
        message: issue.message,
        line: issue.line ?? "-",
      })),
      {
        emptyMessage: "No issues found.",
      },
    );
  }

  if (errorCount > 0) {
    throw new GhitgudError("Workflow validation failed.");
  }

  logger.success("Workflow validation passed.");
  return { success: true, metadata: results };
};

const dryRun = async (targetPath?: string) => {
  logger.start("Building workflow dry-run preview.");
  const files = getWorkflowFiles(targetPath);

  const results: WorkflowDryRunResult[] = files.map((file) => {
    const content = fs.readFileSync(file, "utf8");
    return parseDryRun(content, file);
  });

  output.renderSummary("Workflow Dry Run", [
    ["Files", results.length],
    ["Jobs", results.reduce((sum, file) => sum + file.jobs.length, 0)],
    [
      "Unresolved Expressions",
      results.reduce((sum, file) => sum + file.unresolvedExpressions.length, 0),
    ],
  ]);

  for (const result of results) {
    output.renderSection(path.basename(result.file));
    output.renderKeyValues([
      ["Workflow", result.workflowName ?? "unnamed"],
      ["Triggers", result.triggers.length ? result.triggers.join(", ") : "n/a"],
    ]);

    output.renderTable(
      result.jobs.map((job) => ({
        job: job.id,
        "runs-on": job.runsOn ?? "n/a",
        needs: job.needs.length ? job.needs.join(", ") : "-",
        matrix: job.matrix.length ? job.matrix.join(" | ") : "-",
      })),
      { emptyMessage: "No jobs discovered." },
    );
  }

  logger.success("Workflow dry-run preview complete.");
  return { success: true, metadata: results };
};

export default {
  validate,
  dryRun,
};
