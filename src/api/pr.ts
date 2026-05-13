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
};

export default pr;
export type { PullRequest };
