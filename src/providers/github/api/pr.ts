import client from "@/providers/github/client";
import type { PullRequest } from "@/types";

interface PullRequestListOptions {
  base?: string;
  head?: string;
  limit: number;
  state: "open" | "closed" | "merged" | "all";
}

function queryString(
  values: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) query.set(key, String(value));
  }

  return query.toString();
}

function searchEndpoint(qualifier: string, repo?: string, limit = 10): string {
  const query = encodeURIComponent(
    ["is:pr", "is:open", qualifier, ...(repo ? [`repo:${repo}`] : [])].join(
      " ",
    ),
  );

  return `/search/issues?q=${query}&sort=updated&order=desc&per_page=${limit}`;
}

const pr = {
  fetchMerged: (repo: string): Promise<Response> =>
    client.get(`/repos/${repo}/pulls?state=closed&per_page=100`),

  getCommit: (sha: string, repo: string): Promise<Response> =>
    client.get(`/repos/${repo}/commits/${sha}`),

  fetch: async (prNumber: number, repo: string): Promise<PullRequest> => {
    const response = await client.getTokenRequired(
      `/repos/${repo}/pulls/${prNumber}`,
    );

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

  repository: (repo: string): Promise<Response> =>
    client.getTokenRequired(`/repos/${repo}`),

  listOpen: (repo: string): Promise<Response> =>
    client.get(`/repos/${repo}/pulls?state=open&per_page=100`),

  list: (repo: string, options: PullRequestListOptions): Promise<Response> => {
    const state = options.state === "merged" ? "closed" : options.state;

    const head =
      options.head && !options.head.includes(":")
        ? `${repo.split("/")[0]}:${options.head}`
        : options.head;

    const query = queryString({
      head,
      state,
      sort: "updated",
      direction: "desc",
      base: options.base,
      per_page: options.limit,
    });

    return client.getTokenRequired(`/repos/${repo}/pulls?${query}`);
  },

  createPr: async (
    repo: string,
    body: {
      title: string;
      head: string;
      base: string;
      body?: string;
      draft: boolean;
    },
  ): Promise<PullRequest> => {
    const response = await client.postTokenRequired(
      `/repos/${repo}/pulls`,
      body,
    );

    return response.json();
  },

  updatePr: async (
    repo: string,
    prNumber: number,
    body: {
      title?: string;
      body?: string;
      base?: string;
      state?: "open" | "closed";
    },
  ): Promise<PullRequest> => {
    const response = await client.patchTokenRequired(
      `/repos/${repo}/pulls/${prNumber}`,
      body,
    );

    return response.json();
  },

  merge: (repo: string, prNumber: number, mergeMethod: string) =>
    client.putTokenRequired(`/repos/${repo}/pulls/${prNumber}/merge`, {
      merge_method: mergeMethod,
    }),

  deleteBranch: (repo: string, branch: string) =>
    client.deleteTokenRequired(
      `/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    ),

  diff: (repo: string, prNumber: number) =>
    client.getTokenRequiredWithAccept(
      `/repos/${repo}/pulls/${prNumber}`,
      "application/vnd.github.diff",
    ),

  comment: (repo: string, prNumber: number, body: string) =>
    client.postTokenRequired(`/repos/${repo}/issues/${prNumber}/comments`, {
      body,
    }),

  lock: (repo: string, prNumber: number) =>
    client.putTokenRequired(`/repos/${repo}/issues/${prNumber}/lock`, {}),

  unlock: (repo: string, prNumber: number) =>
    client.deleteTokenRequired(`/repos/${repo}/issues/${prNumber}/lock`),

  ready: (repo: string, prNumber: number) =>
    client.postTokenRequired(
      `/repos/${repo}/pulls/${prNumber}/ready_for_review`,
      {},
    ),

  checkRuns: (repo: string, sha: string) =>
    client.getTokenRequired(
      `/repos/${repo}/commits/${sha}/check-runs?per_page=100`,
    ),

  combinedStatus: (repo: string, sha: string) =>
    client.getTokenRequired(
      `/repos/${repo}/commits/${sha}/status?per_page=100`,
    ),

  status: (kind: "author:@me" | "review-requested:@me", repo?: string) =>
    client.getTokenRequired(searchEndpoint(kind, repo)),
};

export default pr;
export type { PullRequestListOptions };
