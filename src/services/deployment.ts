import api from "@/api/deployments";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GitfleetError } from "@/core/errors";

interface DeploymentApiEntry {
  id: number;
  url?: string;
  sha?: string;
  ref?: string;
  task?: string;
  payload?: Record<string, unknown>;
  original_environment?: string;
  environment?: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  statuses_url?: string;
  repository_url?: string;
  transient_environment?: boolean;
  production_environment?: boolean;
  creator?: { login?: string } | null;
}

interface DeploymentStatusApiEntry {
  id: number;
  state?: string;
  description?: string | null;
  target_url?: string | null;
  created_at?: string;
  environment?: string;
  creator?: { login?: string } | null;
}

const VALID_STATES = new Set([
  "error",
  "failure",
  "inactive",
  "in_progress",
  "queued",
  "pending",
  "success",
]);

const normalizeDeployment = (d: DeploymentApiEntry) => ({
  id: d.id,
  ref: d.ref ?? "-",
  environment: d.environment ?? "-",
  task: d.task ?? "-",
  description: d.description ?? "-",
  creator: d.creator?.login ?? "-",
  createdAt: d.created_at ?? "-",
  production: d.production_environment ? "yes" : "no",
});

const normalizeStatus = (s: DeploymentStatusApiEntry) => ({
  id: s.id,
  state: s.state ?? "-",
  description: s.description ?? "-",
  creator: s.creator?.login ?? "-",
  createdAt: s.created_at ?? "-",
});

const list = async (
  options: { repo?: string; environment?: string; limit?: number } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const limit = options.limit ?? 30;
  if (limit < 1 || limit > 100)
    throw new GitfleetError("Limit must be between 1 and 100.");
  logger.start(`Loading deployments for ${repo}.`);
  const response = await api.list(repo, {
    environment: options.environment,
    limit,
  });
  const deployments = (await response.json()) as DeploymentApiEntry[];
  output.renderTable(deployments.map(normalizeDeployment), {
    emptyMessage: "No deployments found.",
  });
  logger.success(`Loaded ${deployments.length} deployment(s).`);
  return { success: true, deployments };
};

const view = async (options: { repo?: string; id: number }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading deployment ${options.id}.`);
  const response = await api.get(repo, options.id);
  const d = (await response.json()) as DeploymentApiEntry;
  output.renderKeyValues([
    ["ID", d.id],
    ["Ref", d.ref ?? "-"],
    ["Environment", d.environment ?? "-"],
    ["Task", d.task ?? "-"],
    ["Description", d.description ?? "-"],
    ["Creator", d.creator?.login ?? "-"],
    ["Production", d.production_environment ? "yes" : "no"],
    ["Transient", d.transient_environment ? "yes" : "no"],
    ["Created", d.created_at ?? "-"],
    ["Updated", d.updated_at ?? "-"],
    ["URL", d.url ?? "-"],
  ]);
  logger.success(`Loaded deployment ${options.id}.`);
  return { success: true, deployment: d };
};

const create = async (options: {
  repo?: string;
  ref: string;
  environment: string;
  description?: string;
  autoMerge?: boolean;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Creating deployment in ${repo}.`);
  const response = await api.create(repo, {
    ref: options.ref,
    environment: options.environment,
    description: options.description,
    auto_merge: options.autoMerge ?? true,
  });
  const d = (await response.json()) as DeploymentApiEntry;
  logger.success(`Created deployment ${d.id}.`);
  return { success: true, deployment: d };
};

const status = async (options: { repo?: string; id: number }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading statuses for deployment ${options.id}.`);
  const response = await api.statuses(repo, options.id);
  const statuses = (await response.json()) as DeploymentStatusApiEntry[];
  output.renderTable(statuses.map(normalizeStatus), {
    emptyMessage: "No statuses found.",
  });
  logger.success(`Loaded ${statuses.length} status(es).`);
  return { success: true, statuses };
};

const createStatus = async (options: {
  repo?: string;
  id: number;
  state: string;
  description?: string;
  targetUrl?: string;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  if (!VALID_STATES.has(options.state)) {
    throw new GitfleetError(
      `Invalid state "${options.state}". Valid states: ${[...VALID_STATES].join(", ")}.`,
    );
  }
  logger.start(`Creating deployment status for deployment ${options.id}.`);
  const response = await api.createStatus(repo, options.id, {
    state: options.state,
    description: options.description,
    target_url: options.targetUrl,
  });
  const s = (await response.json()) as DeploymentStatusApiEntry;
  logger.success(`Created ${s.state} status for deployment ${options.id}.`);
  return { success: true, status: s };
};

export default { list, view, create, status, createStatus };
