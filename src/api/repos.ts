import client from "./client";
import { RepoSummary } from "@/types";

export interface GitHubRepoResponse {
  id: number;
  name: string;
  fork: boolean;
  private: boolean;
  archived: boolean;
  full_name: string;
  html_url?: string;
  clone_url?: string;
  visibility?: string;
  default_branch: string;
  pushed_at: string | null;
  homepage?: string | null;
  owner?: { login: string };
  open_issues_count?: number;
  stargazers_count?: number;
  description?: string | null;
  parent?: { full_name: string };
  has_vulnerability_alerts?: boolean;
}

export interface CreateRepoOptions {
  name: string;
  owner?: string;
  template?: string;
  description?: string;
  ownerType?: "user" | "org";
  visibility: "public" | "private" | "internal";
}

export interface UpdateRepoOptions {
  name?: string;
  homepage?: string;
  archived?: boolean;
  description?: string;
  visibility?: "public" | "private";
}

const normalizeRepo = (repo: GitHubRepoResponse): RepoSummary => ({
  id: repo.id,
  name: repo.name,
  fork: repo.fork,
  private: repo.private,
  archived: repo.archived,
  fullName: repo.full_name,
  pushedAt: repo.pushed_at,
  defaultBranch: repo.default_branch,
});

const parse = async (response: Response): Promise<GitHubRepoResponse> =>
  (await response.json()) as GitHubRepoResponse;

const repos = {
  fetchOrg: async (org: string): Promise<RepoSummary[]> => {
    const data = await client.getPaginated<GitHubRepoResponse>(
      `/orgs/${encodeURIComponent(org)}/repos?per_page=${client.getDefaultPerPage()}&type=all`,
    );
    return data.map(normalizeRepo);
  },

  fetchUserRepos: async (): Promise<RepoSummary[]> => {
    const data = await client.getPaginated<GitHubRepoResponse>(
      `/user/repos?per_page=${client.getDefaultPerPage()}&sort=updated`,
    );
    return data.map(normalizeRepo);
  },

  fetchUser: async (username: string): Promise<RepoSummary[]> => {
    const data = await client.getPaginated<GitHubRepoResponse>(
      `/users/${encodeURIComponent(username)}/repos?per_page=${client.getDefaultPerPage()}&type=all`,
    );
    return data.map(normalizeRepo);
  },

  get: async (repo: string): Promise<GitHubRepoResponse> =>
    parse(await client.get(`/repos/${repo}`)),

  create: async (options: CreateRepoOptions): Promise<GitHubRepoResponse> => {
    const body = {
      name: options.name,
      description: options.description,
      visibility: options.visibility,
    };

    if (options.template) {
      const [owner, name] = options.template.split("/");

      return parse(
        await client.postTokenRequired(`/repos/${owner}/${name}/generate`, {
          ...body,
          owner: options.owner,
          private: options.visibility === "private",
        }),
      );
    }

    const endpoint =
      options.ownerType === "org"
        ? `/orgs/${encodeURIComponent(options.owner ?? "")}/repos`
        : "/user/repos";

    return parse(await client.postTokenRequired(endpoint, body));
  },

  update: async (
    repo: string,
    options: UpdateRepoOptions,
  ): Promise<GitHubRepoResponse> =>
    parse(await client.patchTokenRequired(`/repos/${repo}`, options)),

  delete: async (repo: string): Promise<Response> =>
    client.deleteTokenRequired(`/repos/${repo}`),

  star: async (repo: string): Promise<Response> =>
    client.putTokenRequired(`/user/starred/${repo}`, {}),

  unstar: async (repo: string): Promise<Response> =>
    client.deleteTokenRequired(`/user/starred/${repo}`),

  fork: async (repo: string): Promise<GitHubRepoResponse> =>
    parse(await client.postTokenRequired(`/repos/${repo}/forks`, {})),

  getBranchProtection: async (
    repo: string,
    branch: string,
  ): Promise<Response> =>
    client.get(`/repos/${repo}/branches/${branch}/protection`),

  archive: async (repo: string): Promise<Response> =>
    client.patch(`/repos/${repo}`, { archived: true }),
};

export default repos;
