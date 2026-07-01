import pc from "picocolors";

import api from "@/api/agent-task";
import output from "@/core/output";
import logger from "@/core/logger";
import spinner from "@/core/spinner";

import type { AgentTask } from "@/types";

const normalizeTask = (raw: Record<string, unknown>): AgentTask => ({
  id: (raw.id as string) ?? "",
  status: (raw.status as string) ?? "unknown",
  description: (raw.description as string) ?? "",
  createdAt: (raw.created_at as string) ?? "",
  updatedAt: (raw.updated_at as string) ?? "",
  url: (raw.url as string) ?? "",
  logs: (raw.logs as string) ?? undefined,
});

const create = async (description: string, repo?: string) => {
  logger.start(`Creating agent task.`);

  const response = await spinner.withSpinner(
    "Creating agent task...",
    async () => api.create(description, repo),
    "Agent task created.",
  );

  const raw = (await response.json()) as Record<string, unknown>;
  const task = normalizeTask(raw);

  output.renderSection("Agent Task Created");
  output.renderKeyValues([
    ["ID", task.id],
    ["Status", task.status],
    ["Description", task.description],
    ["URL", task.url],
  ]);

  return { success: true, task };
};

const list = async (repo?: string) => {
  logger.start("Fetching agent tasks.");

  const response = await spinner.withSpinner(
    "Fetching agent tasks...",
    async () => api.list(repo),
    "Fetched agent tasks.",
  );

  const rawTasks = (await response.json()) as Record<string, unknown>[];
  const tasks = rawTasks.map(normalizeTask);

  if (tasks.length === 0) {
    logger.info("No agent tasks found.");
    return { success: true, tasks: [] };
  }

  output.renderTable(
    tasks.map((t) => ({
      ID: t.id.slice(0, 8),
      Status: t.status,
      Description: pc.dim(t.description.slice(0, 50)),
      Updated: t.updatedAt,
    })),
  );

  return { success: true, tasks };
};

const view = async (sessionId: string, repo?: string) => {
  logger.start(`Fetching agent task ${sessionId}.`);

  const response = await spinner.withSpinner(
    `Fetching agent task ${sessionId}...`,
    async () => api.view(sessionId, repo),
    `Fetched agent task ${sessionId}.`,
  );

  const raw = (await response.json()) as Record<string, unknown>;
  const task = normalizeTask(raw);

  output.renderSection(`Agent Task ${sessionId}`);
  output.renderKeyValues([
    ["ID", task.id],
    ["Status", task.status],
    ["Description", task.description],
    ["Created", task.createdAt],
    ["Updated", task.updatedAt],
    ["URL", task.url],
  ]);

  if (task.logs) {
    output.renderSection("Logs");
    output.writeValue(task.logs);
  }

  return { success: true, task };
};

export default { create, list, view };
