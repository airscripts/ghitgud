import client from "./client";

interface PullRequest {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  head: {
    ref: string;
    repo: {
      full_name: string;
      html_url: string;
    } | null;
  };
  base: {
    ref: string;
  };
  merge_commit_sha: string | null;
}

const pr = {
  fetchMerged: async (): Promise<Response> => {
    const repo = client.getRepo();
    return client.get(`/repos/${repo}/pulls?state=closed&per_page=100`);
  },

  getCommit: async (sha: string): Promise<Response> => {
    const repo = client.getRepo();
    return client.get(`/repos/${repo}/commits/${sha}`);
  },

  fetch: async (prNumber: number): Promise<PullRequest> => {
    const repo = client.getRepo();
    const response = await client.get(`/repos/${repo}/pulls/${prNumber}`);
    return response.json();
  },

  checkPushAccess: async (repo: string): Promise<boolean> => {
    try {
      const response = await client.get(`/repos/${repo}`);
      const data = await response.json();
      return data.permissions?.push === true;
    } catch {
      return false;
    }
  },
};

export default pr;
export type { PullRequest };
