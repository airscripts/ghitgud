import client from "@/providers/github/client";

type StatusKind =
  | "assignedIssues"
  | "authoredIssues"
  | "authoredPullRequests"
  | "reviewRequests"
  | "mentions";

const qualifiers: Record<StatusKind, string[]> = {
  assignedIssues: ["is:issue", "is:open", "assignee:@me"],
  authoredIssues: ["is:issue", "is:open", "author:@me"],
  authoredPullRequests: ["is:pr", "is:open", "author:@me"],
  reviewRequests: ["is:pr", "is:open", "review-requested:@me"],
  mentions: ["is:open", "mentions:@me"],
};

const search = (kind: StatusKind, org?: string, limit = 20) => {
  const query = [...qualifiers[kind], ...(org ? [`org:${org}`] : [])].join(" ");
  return client.getTokenRequired(
    `/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${limit}`,
  );
};

export default { search };
export type { StatusKind };
