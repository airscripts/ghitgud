import api from "@/api/codespaces";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GitfleetError } from "@/core/errors";

interface CodespaceEntry {
  id: number;
  name: string;
  state: string;
  owner: { login: string };
  repository: { full_name: string };
  git_status: { ref: string };
  created_at: string;
  idle_timeout_minutes: number;
  machine: { display_name: string };
}

const list = async () => {
  logger.start("Loading codespaces.");
  const response = await api.list();
  const data = (await response.json()) as {
    total_count: number;
    codespaces: CodespaceEntry[];
  };
  output.renderTable(
    data.codespaces.map((cs) => ({
      name: cs.name,
      state: cs.state,
      repo: cs.repository?.full_name ?? "-",
      branch: cs.git_status?.ref ?? "-",
      machine: cs.machine?.display_name ?? "-",
      idle: `${cs.idle_timeout_minutes ?? "-"} min`,
    })),
    { emptyMessage: "No codespaces found." },
  );
  logger.success(`Loaded ${data.codespaces.length} codespace(s).`);
  return { success: true, codespaces: data.codespaces };
};

const view = async (codespaceId: string) => {
  logger.start(`Loading codespace ${codespaceId}.`);
  const response = await api.get(codespaceId);
  const cs = (await response.json()) as CodespaceEntry &
    Record<string, unknown>;
  output.renderKeyValues([
    ["ID", String(cs.id)],
    ["Name", cs.name],
    ["State", cs.state],
    ["Repo", cs.repository?.full_name ?? "-"],
    ["Branch", cs.git_status?.ref ?? "-"],
    ["Machine", cs.machine?.display_name ?? "-"],
    ["Idle Timeout", `${cs.idle_timeout_minutes ?? "-"} min`],
    ["Created", cs.created_at ?? "-"],
  ]);
  logger.success(`Loaded codespace ${cs.name}.`);
  return { success: true, codespace: cs };
};

const create = async (options: {
  repo?: string;
  ref?: string;
  machine?: string;
  idleTimeout?: number;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Creating codespace for ${repo}.`);
  const data: Record<string, unknown> = {};
  if (options.ref) data.ref = options.ref;
  if (options.machine) data.machine = options.machine;
  if (options.idleTimeout) data.idle_timeout_minutes = options.idleTimeout;
  const response = await api.create(repo, data);
  const cs = (await response.json()) as CodespaceEntry;
  output.renderKeyValues([
    ["ID", String(cs.id)],
    ["Name", cs.name],
    ["State", cs.state],
    ["Repo", cs.repository?.full_name ?? "-"],
    ["Branch", cs.git_status?.ref ?? "-"],
  ]);
  logger.success(`Created codespace ${cs.name}.`);
  return { success: true, codespace: cs };
};

const startCs = async (codespaceId: string) => {
  logger.start(`Starting codespace ${codespaceId}.`);
  await api.start(codespaceId);
  logger.success(`Started codespace ${codespaceId}.`);
  return { success: true };
};

const stopCs = async (codespaceId: string) => {
  logger.start(`Stopping codespace ${codespaceId}.`);
  await api.stop(codespaceId);
  logger.success(`Stopped codespace ${codespaceId}.`);
  return { success: true };
};

const deleteCs = async (
  codespaceId: string,
  options: { yes?: boolean } = {},
) => {
  if (!options.yes) {
    throw new GitfleetError("Development environment deletion requires --yes.");
  }
  logger.start(`Deleting codespace ${codespaceId}.`);
  await api.delete(codespaceId);
  logger.success(`Deleted codespace ${codespaceId}.`);
  return { success: true };
};

export default {
  list,
  view,
  create,
  start: startCs,
  stop: stopCs,
  delete: deleteCs,
};
