import client from "./client";
import { RepoSummary } from "@/types";

interface GitHubRepoResponse {
  id: number;
  name: string;
  fork: boolean;
  private: boolean;
  archived: boolean;
  full_name: string;
  default_branch: string;
  pushed_at: string | null;
  has_vulnerability_alerts?: boolean;
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

const repos = {
  fetchOrg: async (org: string): Promise<RepoSummary[]> => {
    const data = await client.getPaginated<GitHubRepoResponse>(
      `/orgs/${org}/repos?per_page=${client.getDefaultPerPage()}&type=all`,
    );

    return data.map(normalizeRepo);
  },

  fetchUserRepos: async (): Promise<RepoSummary[]> => {
    const data = await client.getPaginated<GitHubRepoResponse>(
      `/user/repos?per_page=${client.getDefaultPerPage()}&sort=updated`,
    );

    return data.map(normalizeRepo);
  },

  get: async (repo: string): Promise<GitHubRepoResponse> => {
    const response = await client.get(`/repos/${repo}`);
    return (await response.json()) as GitHubRepoResponse;
  },

  getBranchProtection: async (
    repo: string,
    branch: string,
  ): Promise<Response> => {
    return client.get(`/repos/${repo}/branches/${branch}/protection`);
  },

  archive: async (repo: string): Promise<Response> => {
    return client.patch(`/repos/${repo}`, { archived: true });
  },
};

export default repos;
