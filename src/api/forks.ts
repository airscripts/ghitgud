import client from "./client";

interface GitHubForkResponse {
  id: number;
  name: string;
  full_name: string;
  owner?: { login?: string } | null;
  html_url?: string;
  default_branch?: string;
  pushed_at?: string | null;
  private?: boolean;
  archived?: boolean;
  fork?: boolean;
  parent?: { full_name?: string; default_branch?: string } | null;
}

interface MergeUpstreamResponse {
  message?: string;
  merge_type?: string;
  base_branch?: string;
}

interface CompareResponse {
  ahead_by?: number;
  behind_by?: number;
  total_commits?: number;
  status?: string;
}

const list = (repo: string): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/forks?per_page=${client.getDefaultPerPage()}`,
  );

const create = (repo: string, options?: { org?: string }): Promise<Response> =>
  client.postTokenRequired(
    `/repos/${repo}/forks`,
    options?.org ? { organization: options.org } : {},
  );

const sync = (repo: string, branch?: string): Promise<MergeUpstreamResponse> =>
  client
    .postTokenRequired(`/repos/${repo}/merge-upstream`, {
      branch: branch ?? "main",
    })
    .then(async (response) => (await response.json()) as MergeUpstreamResponse);

const compare = (
  repo: string,
  base: string,
  head: string,
): Promise<CompareResponse> =>
  client
    .getTokenRequired(
      `/repos/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
    )
    .then(async (response) => (await response.json()) as CompareResponse);

export default { list, create, sync, compare };
export type { GitHubForkResponse, MergeUpstreamResponse, CompareResponse };
