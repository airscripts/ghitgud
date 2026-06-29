import api from "@/api/search";
import output from "@/core/output";
import logger from "@/core/logger";

import type {
  SearchResult,
  RepoSearchItem,
  CodeSearchItem,
  IssueSearchItem,
  CommitSearchItem,
} from "@/types/search";

function extractRepoName(repositoryUrl: string): string {
  return repositoryUrl.replace("https://api.github.com/repos/", "");
}

function searchIssues(
  query: string,

  options: {
    repo?: string;
    sort?: string;
    state?: string;
    order?: string;
    limit?: number;
  } = {},
) {
  return searchAndRender("issues", query, options);
}

function searchPrs(
  query: string,

  options: {
    repo?: string;
    sort?: string;
    state?: string;
    order?: string;
    limit?: number;
  } = {},
) {
  return searchAndRender("prs", query, options);
}

function searchRepos(
  query: string,

  options: {
    sort?: string;
    order?: string;
    limit?: number;
    language?: string;
  } = {},
) {
  return searchAndRender("repos", query, options);
}

function searchCode(
  query: string,

  options: {
    repo?: string;
    sort?: string;
    limit?: number;
    language?: string;
  } = {},
) {
  return searchAndRender("code", query, options);
}

function searchCommits(
  query: string,

  options: {
    repo?: string;
    sort?: string;
    order?: string;
    limit?: number;
    author?: string;
  } = {},
) {
  return searchAndRender("commits", query, options);
}

async function searchAndRender(
  kind: "issues" | "prs" | "repos" | "code" | "commits",
  query: string,
  options: Record<string, unknown>,
): Promise<
  SearchResult<
    IssueSearchItem | RepoSearchItem | CodeSearchItem | CommitSearchItem
  >
> {
  const label = kind === "prs" ? "pull requests" : kind;
  logger.start(`Searching ${label} for: ${query}`);

  const apiOptions: Record<string, unknown> = {};
  if (options.repo) apiOptions.repo = options.repo;
  if (options.state) apiOptions.state = options.state;
  if (options.language) apiOptions.language = options.language;
  if (options.author) apiOptions.author = options.author;
  if (options.sort) apiOptions.sort = options.sort;
  if (options.order) apiOptions.order = options.order;
  if (options.limit) apiOptions.limit = options.limit;

  let result: SearchResult<
    IssueSearchItem | RepoSearchItem | CodeSearchItem | CommitSearchItem
  >;

  switch (kind) {
    case "issues":
      result = await api.issues(query, apiOptions);

      renderIssueResults(
        result as SearchResult<IssueSearchItem>,
        "No issues found.",
      );

      break;

    case "prs":
      result = await api.prs(query, apiOptions);

      renderIssueResults(
        result as SearchResult<IssueSearchItem>,
        "No pull requests found.",
      );

      break;

    case "repos":
      result = await api.repos(query, apiOptions);
      renderRepoResults(result as SearchResult<RepoSearchItem>);
      break;

    case "code":
      result = await api.code(query, apiOptions);
      renderCodeResults(result as SearchResult<CodeSearchItem>);
      break;

    case "commits":
      result = await api.commits(query, apiOptions);
      renderCommitResults(result as SearchResult<CommitSearchItem>);
      break;
  }

  logger.success(`Found ${result.totalCount} result(s).`);
  return result;
}

function renderIssueResults(
  result: SearchResult<IssueSearchItem>,
  emptyMessage: string,
): void {
  const { totalCount, incompleteResults, items } = result;

  output.renderTable(
    items.map((item) => ({
      title: item.title,
      state: item.state,
      updated: item.updatedAt,
      number: `#${item.number}`,
      author: item.user?.login ?? "-",
      repo: extractRepoName(item.repositoryUrl),
      type: item.isPullRequest ? "PR" : "Issue",
    })),

    { emptyMessage },
  );

  const summaryEntries: Array<[string, string | number]> = [
    ["Total", totalCount],
    ["Showing", items.length],
  ];

  if (incompleteResults) {
    summaryEntries.push(["Warning", "Results may be incomplete"]);
  }

  output.renderSummary("Search Results", summaryEntries);
}

function renderRepoResults(result: SearchResult<RepoSearchItem>): void {
  const { totalCount, incompleteResults, items } = result;

  output.renderTable(
    items.map((item) => ({
      name: item.fullName,
      forks: item.forksCount,
      updated: item.updatedAt,
      stars: item.stargazersCount,
      language: item.language ?? "-",
      private: item.private ? "yes" : "no",
      archived: item.archived ? "yes" : "no",
    })),

    { emptyMessage: "No repositories found." },
  );

  const summaryEntries: Array<[string, string | number]> = [
    ["Total", totalCount],
    ["Showing", items.length],
  ];

  if (incompleteResults) {
    summaryEntries.push(["Warning", "Results may be incomplete"]);
  }

  output.renderSummary("Search Results", summaryEntries);
}

function renderCodeResults(result: SearchResult<CodeSearchItem>): void {
  const { totalCount, incompleteResults, items } = result;

  output.renderTable(
    items.map((item) => ({
      file: item.path,
      repo: item.repository.fullName,
    })),

    { emptyMessage: "No code results found." },
  );

  const summaryEntries: Array<[string, string | number]> = [
    ["Total", totalCount],
    ["Showing", items.length],
  ];

  if (incompleteResults) {
    summaryEntries.push(["Warning", "Results may be incomplete"]);
  }

  output.renderSummary("Search Results", summaryEntries);
}

function renderCommitResults(result: SearchResult<CommitSearchItem>): void {
  const { totalCount, incompleteResults, items } = result;

  output.renderTable(
    items.map((item) => ({
      date: item.date,
      sha: item.sha.substring(0, 7),
      author: item.author?.login ?? "-",
      message: item.message.split("\n")[0],
    })),

    { emptyMessage: "No commits found." },
  );

  const summaryEntries: Array<[string, string | number]> = [
    ["Total", totalCount],
    ["Showing", items.length],
  ];

  if (incompleteResults) {
    summaryEntries.push(["Warning", "Results may be incomplete"]);
  }

  output.renderSummary("Search Results", summaryEntries);
}

export default {
  searchPrs,
  searchCode,
  searchRepos,
  searchIssues,
  searchCommits,
};
