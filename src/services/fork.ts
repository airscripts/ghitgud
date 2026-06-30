import api from "@/api/forks";
import reposApi from "@/api/repos";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GhitgudError } from "@/core/errors";

interface ForkSyncResult {
  repo: string;
  message: string;
  branch: string;
}

interface ForkCompareResult {
  repo: string;
  aheadBy: number;
  behindBy: number;
  status: string;
}

const list = async (options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading forks for ${repo}.`);
  const response = await api.list(repo);
  const forks = (await response.json()) as Array<
    import("@/api/forks").GitHubForkResponse
  >;
  const normalized = forks.map((f) => ({
    id: f.id,
    name: f.name,
    fullName: f.full_name,
    owner: f.owner?.login ?? "-",
    defaultBranch: f.default_branch ?? "main",
    pushedAt: f.pushed_at ?? "-",
    parent: f.parent?.full_name ?? "-",
  }));
  output.renderTable(normalized, { emptyMessage: "No forks found." });
  logger.success(`Loaded ${forks.length} fork(s).`);
  return { success: true, forks: normalized };
};

const sync = async (options: { repo?: string; branch?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const repoInfo = await reposApi.get(repo);
  const branch = options.branch ?? repoInfo.default_branch ?? "main";
  logger.start(`Syncing ${repo} with upstream (${branch}).`);
  const result = await api.sync(repo, branch);
  logger.success(`Synced ${repo} with upstream on ${branch}.`);
  return { success: true, repo, message: result.message ?? "Synced", branch };
};

const compare = async (
  options: { repo?: string; upstream?: string; branch?: string } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const repoInfo = await reposApi.get(repo);
  const upstream = options.upstream ?? repoInfo.parent?.full_name;
  if (!upstream)
    throw new GhitgudError(
      "No upstream parent found. Use --upstream to specify.",
    );
  const branch = options.branch ?? repoInfo.default_branch ?? "main";
  logger.start(`Comparing ${repo} with ${upstream} (${branch}).`);
  const result = await api.compare(repo, `${upstream}:${branch}`, branch);
  output.renderSummary(`Fork Compare: ${repo}`, [
    ["Upstream", upstream],
    ["Branch", branch],
    ["Ahead by", String(result.ahead_by ?? 0)],
    ["Behind by", String(result.behind_by ?? 0)],
    ["Status", result.status ?? "unknown"],
  ]);
  logger.success("Comparison loaded.");
  return {
    success: true,
    repo,
    aheadBy: result.ahead_by ?? 0,
    behindBy: result.behind_by ?? 0,
    status: result.status ?? "unknown",
  };
};

const create = async (options: {
  repo: string;
  org?: string;
  clone?: boolean;
}) => {
  logger.start(`Forking ${options.repo}.`);
  const response = await api.create(options.repo, { org: options.org });
  const fork = (await response.json()) as {
    id: number;
    full_name: string;
    html_url?: string;
  };
  logger.success(`Forked ${options.repo} to ${fork.full_name}.`);
  return { success: true, fork };
};

export default { list, sync, compare, create };
export type { ForkSyncResult, ForkCompareResult };
