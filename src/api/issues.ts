import client from "./client";

interface SearchResponse {
  total_count: number;
}

function buildQuery(repo: string, qualifiers: string[]): string {
  return encodeURIComponent([`repo:${repo}`, ...qualifiers].join(" "));
}

async function getCount(repo: string, qualifiers: string[]): Promise<number> {
  const response = await client.get(
    `/search/issues?q=${buildQuery(repo, qualifiers)}&per_page=1`,
  );

  const data = (await response.json()) as SearchResponse;
  return data.total_count;
}

const issues = {
  countOpen: async (repo: string): Promise<number> => {
    return getCount(repo, ["type:issue", "state:open"]);
  },

  countStale: async (repo: string, olderThan: string): Promise<number> => {
    return getCount(repo, [
      "type:issue",
      "state:open",
      `updated:<${olderThan}`,
    ]);
  },
};

export default issues;
