interface SearchResult<T> {
  items: T[];
  totalCount: number;
  incompleteResults: boolean;
}

interface IssueSearchItem {
  id: number;
  title: string;
  state: string;
  score: number;
  number: number;
  htmlUrl: string;
  comments: number;
  updatedAt: string;
  createdAt: string;
  body: string | null;
  repositoryUrl: string;
  isPullRequest: boolean;
  user: { login: string } | null;
  assignees: Array<{ login: string }>;
  labels: Array<{ name: string; color?: string }>;
}

interface RepoSearchItem {
  id: number;
  name: string;
  score: number;
  htmlUrl: string;
  fullName: string;
  private: boolean;
  archived: boolean;
  updatedAt: string;
  forksCount: number;
  language: string | null;
  stargazersCount: number;
  description: string | null;
}

interface CodeSearchItem {
  name: string;
  path: string;
  score: number;
  htmlUrl: string;
  repository: { fullName: string };
}

interface CommitSearchItem {
  sha: string;
  date: string;
  score: number;
  htmlUrl: string;
  message: string;
  author: { login: string } | null;
}

interface SearchOptions {
  repo?: string;
  sort?: string;
  limit?: number;
  state?: string;
  author?: string;
  language?: string;
  order?: "asc" | "desc";
}

function normalizeIssueSearchItem(
  raw: Record<string, unknown>,
): IssueSearchItem {
  return {
    id: raw.id as number,
    title: raw.title as string,
    state: raw.state as string,
    number: raw.number as number,
    htmlUrl: raw.html_url as string,
    isPullRequest: !!raw.pull_request,
    repositoryUrl: raw.repository_url as string,

    user: raw.user
      ? { login: (raw.user as Record<string, unknown>).login as string }
      : null,

    labels: Array.isArray(raw.labels)
      ? raw.labels.map((l: unknown) => {
          const label = l as Record<string, unknown>;

          return {
            name: label.name as string,
            color: label.color as string | undefined,
          };
        })
      : [],

    score: raw.score as number,
    body: (raw.body as string) ?? null,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
    comments: (raw.comments as number) ?? 0,

    assignees: Array.isArray(raw.assignees)
      ? raw.assignees.map((a: unknown) => ({
          login: (a as Record<string, unknown>).login as string,
        }))
      : [],
  };
}

function normalizeRepoSearchItem(raw: Record<string, unknown>): RepoSearchItem {
  return {
    id: raw.id as number,
    name: raw.name as string,
    score: raw.score as number,
    htmlUrl: raw.html_url as string,
    private: raw.private as boolean,
    fullName: raw.full_name as string,
    updatedAt: raw.updated_at as string,
    language: (raw.language as string) ?? null,
    forksCount: (raw.forks_count as number) ?? 0,
    archived: (raw.archived as boolean) ?? false,
    description: (raw.description as string) ?? null,
    stargazersCount: (raw.stargazers_count as number) ?? 0,
  };
}

function normalizeCodeSearchItem(raw: Record<string, unknown>): CodeSearchItem {
  const repo = raw.repository as Record<string, unknown>;

  return {
    name: raw.name as string,
    path: raw.path as string,
    score: raw.score as number,
    htmlUrl: raw.html_url as string,
    repository: { fullName: repo.full_name as string },
  };
}

function normalizeCommitSearchItem(
  raw: Record<string, unknown>,
): CommitSearchItem {
  const commit = raw.commit as Record<string, unknown>;
  const author = commit.author as Record<string, unknown> | undefined;

  return {
    sha: raw.sha as string,
    score: raw.score as number,
    htmlUrl: raw.html_url as string,
    date: (author?.date as string) ?? "",
    message: (commit?.message as string) ?? "",
    author: author?.login ? { login: author.login as string } : null,
  };
}

export type {
  SearchResult,
  SearchOptions,
  RepoSearchItem,
  CodeSearchItem,
  IssueSearchItem,
  CommitSearchItem,
};

export {
  normalizeRepoSearchItem,
  normalizeCodeSearchItem,
  normalizeIssueSearchItem,
  normalizeCommitSearchItem,
};
