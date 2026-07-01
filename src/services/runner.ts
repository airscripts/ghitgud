import api from "@/api/runners";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import prompt from "@/core/prompt";
import { GitfleetError } from "@/core/errors";
import type { RunnerTarget } from "@/api/runners";

const resolveTarget = async (options: {
  repo?: string;
  org?: string;
}): Promise<RunnerTarget> => {
  if (options.repo && options.org) {
    throw new GitfleetError("Use either --repo or --org, not both.");
  }
  if (options.org) return { org: options.org };
  return { repo: await repoResolver.resolveRepo(options.repo) };
};

interface RunnerEntry {
  id: number;
  name: string;
  os: string;
  status: string;
  busy: boolean;
  labels: Array<{ name: string }>;
}

const list = async (
  options: { repo?: string; org?: string; label?: string } = {},
) => {
  const target = await resolveTarget(options);
  logger.start("Loading self-hosted runners.");
  const response = await api.list(target, { label: options.label });
  const data = (await response.json()) as {
    total_count: number;
    runners: RunnerEntry[];
  };
  output.renderTable(
    data.runners.map((runner) => ({
      id: runner.id,
      name: runner.name,
      os: runner.os,
      status: runner.status,
      busy: runner.busy ? "yes" : "no",
      labels: runner.labels.map((l) => l.name).join(", ") || "-",
    })),
    { emptyMessage: "No runners found." },
  );
  logger.success(`Loaded ${data.runners.length} runner(s).`);
  return { success: true, runners: data.runners };
};

const view = async (
  runnerId: number,
  options: { repo?: string; org?: string } = {},
) => {
  const target = await resolveTarget(options);
  logger.start(`Loading runner ${runnerId}.`);
  const response = await api.get(target, runnerId);
  const runner = (await response.json()) as RunnerEntry &
    Record<string, unknown>;
  output.renderKeyValues([
    ["ID", runner.id],
    ["Name", runner.name],
    ["OS", runner.os],
    ["Status", runner.status],
    ["Busy", runner.busy ? "yes" : "no"],
    [
      "Labels",
      runner.labels?.map((l: { name: string }) => l.name).join(", ") ?? "-",
    ],
  ]);
  logger.success(`Loaded runner ${runnerId}.`);
  return { success: true, runner };
};

const status = async (
  runnerId: number,
  options: { repo?: string; org?: string } = {},
) => {
  const target = await resolveTarget(options);
  logger.start(`Checking status for runner ${runnerId}.`);
  const response = await api.get(target, runnerId);
  const runner = (await response.json()) as RunnerEntry;
  output.renderKeyValues([
    ["ID", runner.id],
    ["Name", runner.name],
    ["Status", runner.status],
    ["Busy", runner.busy ? "yes" : "no"],
  ]);
  logger.success(`Runner ${runnerId} is ${runner.status}.`);
  return { success: true, runner };
};

const removeRunner = async (
  runnerId: number,
  options: { repo?: string; org?: string; yes?: boolean } = {},
) => {
  const target = await resolveTarget(options);
  if (!options.yes) {
    prompt.guardNonInteractive("Runner removal requires --yes.");
    if (!(await prompt.confirm(`Remove runner ${runnerId}?`)))
      return { success: false };
  }
  logger.start(`Removing runner ${runnerId}.`);
  await api.remove(target, runnerId);
  logger.success(`Removed runner ${runnerId}.`);
  return { success: true };
};

const listLabels = async (
  runnerId: number,
  options: { repo?: string; org?: string } = {},
) => {
  const target = await resolveTarget(options);
  logger.start(`Loading labels for runner ${runnerId}.`);
  const response = await api.labels(target, runnerId);
  const data = (await response.json()) as {
    total_count: number;
    labels: Array<{ id: number; name: string; type: string }>;
  };
  output.renderTable(
    data.labels.map((label) => ({
      id: label.id,
      name: label.name,
      type: label.type,
    })),
    { emptyMessage: "No labels found." },
  );
  logger.success(`Loaded ${data.labels.length} label(s).`);
  return { success: true, labels: data.labels };
};

export default { list, view, status, remove: removeRunner, labels: listLabels };
