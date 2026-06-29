import client from "./client";

interface PullRequestSummary {
  created_at: string;
  merged_at: string | null;
}

function buildQuery(repo: string, qualifiers: string[]): string {
  return encodeURIComponent([`repo:${repo}`, ...qualifiers].join(" "));
}

const pulls = {
  countOpen: async (repo: string): Promise<number> => {
    const response = await client.get(
      `/search/issues?q=${buildQuery(repo, ["type:pr", "state:open"])}&per_page=1`,
    );

    const data = (await response.json()) as { total_count: number };
    return data.total_count;
  },

  listMergedSince: async (
    repo: string,
    since: string,
  ): Promise<PullRequestSummary[]> => {
    const pulls = await client.getPaginated<PullRequestSummary>(
      `/repos/${repo}/pulls?state=closed&per_page=${client.getDefaultPerPage()}`,
    );

    return pulls.filter((pull) => {
      if (!pull.merged_at) return false;
      return new Date(pull.merged_at) >= new Date(since);
    });
  },
};

export default pulls;
