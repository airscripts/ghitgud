import api, { StatusKind } from "@/api/status";
import output from "@/core/output";
import logger from "@/core/logger";

interface RawStatusItem {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  repository_url: string;
  updated_at: string;
  user?: { login?: string } | null;
}

interface StatusItem {
  id: number;
  number: number;
  title: string;
  state: string;
  url: string;
  repository: string;
  updatedAt: string;
  author: string | null;
}

const categoryLabels: Record<StatusKind, string> = {
  assignedIssues: "Assigned Issues",
  authoredIssues: "Authored Issues",
  authoredPullRequests: "Authored Pull Requests",
  reviewRequests: "Review Requests",
  mentions: "Mentions",
};

const normalize = (item: RawStatusItem): StatusItem => ({
  id: item.id,
  number: item.number,
  title: item.title,
  state: item.state,
  url: item.html_url,
  repository: item.repository_url.replace(/^.*\/repos\//, ""),
  updatedAt: item.updated_at,
  author: item.user?.login ?? null,
});

const status = async (options: { org?: string; exclude?: string[] }) => {
  logger.start("Loading cross-repository status.");
  const kinds = Object.keys(categoryLabels) as StatusKind[];
  const responses = await Promise.all(
    kinds.map((kind) => api.search(kind, options.org)),
  );
  const excluded = new Set(
    (options.exclude ?? []).map((repo) => repo.trim().toLowerCase()),
  );
  const metadata = Object.fromEntries(
    await Promise.all(
      responses.map(async (response, index) => {
        const payload = (await response.json()) as { items?: RawStatusItem[] };
        const items = (payload.items ?? [])
          .map(normalize)
          .filter((item) => !excluded.has(item.repository.toLowerCase()))
          .filter(
            (item, itemIndex, all) =>
              all.findIndex((candidate) => candidate.id === item.id) ===
              itemIndex,
          );
        return [kinds[index], items];
      }),
    ),
  ) as Record<StatusKind, StatusItem[]>;

  output.renderSummary("GitHub Status", [
    ["Assigned Issues", metadata.assignedIssues.length],
    ["Authored Issues", metadata.authoredIssues.length],
    ["Authored PRs", metadata.authoredPullRequests.length],
    ["Review Requests", metadata.reviewRequests.length],
    ["Mentions", metadata.mentions.length],
  ]);

  for (const kind of kinds) {
    output.renderSection(categoryLabels[kind]);
    output.renderTable(
      metadata[kind].map((item) => ({
        repository: item.repository,
        number: `#${item.number}`,
        title: item.title,
        updated: item.updatedAt,
      })),
      { emptyMessage: `No ${categoryLabels[kind].toLowerCase()} found.` },
    );
  }
  logger.success("Cross-repository status loaded.");
  return {
    success: true,
    org: options.org ?? null,
    counts: Object.fromEntries(
      kinds.map((kind) => [kind, metadata[kind].length]),
    ),
    metadata,
  };
};

export default { status };
export type { StatusItem };
