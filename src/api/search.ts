import client from "./client";

import {
  normalizeRepoSearchItem,
  normalizeCodeSearchItem,
  normalizeIssueSearchItem,
  normalizeCommitSearchItem,
} from "@/types/search";

import type {
  SearchResult,
  SearchOptions,
  RepoSearchItem,
  CodeSearchItem,
  IssueSearchItem,
  CommitSearchItem,
} from "@/types/search";

import { SEARCH_MAX_PER_PAGE } from "@/core/constants";

interface SearchEndpointOptions {
  sort?: string;
  order?: string;
  perPage?: number;
}

function buildSearchQuery(query: string, qualifiers: string[]): string {
  const parts = [query, ...qualifiers].filter(Boolean);
  return encodeURIComponent(parts.join(" "));
}

function searchIssuesEndpoint(
  query: string,
  qualifiers: string[],
  options: SearchEndpointOptions,
): string {
  const q = buildSearchQuery(query, qualifiers);
  const params = [`q=${q}`];

  if (options.sort) params.push(`sort=${options.sort}`);
  params.push(`order=${options.order ?? "desc"}`);
  params.push(`per_page=${options.perPage ?? SEARCH_MAX_PER_PAGE}`);

  return `/search/issues?${params.join("&")}`;
}

function searchReposEndpoint(
  query: string,
  qualifiers: string[],
  options: SearchEndpointOptions,
): string {
  const q = buildSearchQuery(query, qualifiers);
  const params = [`q=${q}`];

  if (options.sort) params.push(`sort=${options.sort}`);
  params.push(`order=${options.order ?? "desc"}`);
  params.push(`per_page=${options.perPage ?? SEARCH_MAX_PER_PAGE}`);

  return `/search/repositories?${params.join("&")}`;
}

function searchCodeEndpoint(
  query: string,
  qualifiers: string[],
  options: SearchEndpointOptions,
): string {
  const q = buildSearchQuery(query, qualifiers);
  const params = [`q=${q}`];

  if (options.sort) params.push(`sort=${options.sort}`);
  params.push(`per_page=${options.perPage ?? SEARCH_MAX_PER_PAGE}`);

  return `/search/code?${params.join("&")}`;
}

function searchCommitsEndpoint(
  query: string,
  qualifiers: string[],
  options: SearchEndpointOptions,
): string {
  const q = buildSearchQuery(query, qualifiers);
  const params = [`q=${q}`];

  if (options.sort) params.push(`sort=${options.sort}`);
  params.push(`order=${options.order ?? "desc"}`);
  params.push(`per_page=${options.perPage ?? SEARCH_MAX_PER_PAGE}`);

  return `/search/commits?${params.join("&")}`;
}

function buildIssueQualifiers(options: SearchOptions): string[] {
  const qualifiers: string[] = [];
  if (options.repo) qualifiers.push(`repo:${options.repo}`);

  if (options.state && options.state !== "all")
    qualifiers.push(`state:${options.state}`);

  if (options.language) qualifiers.push(`language:${options.language}`);
  if (options.author) qualifiers.push(`author:${options.author}`);

  return qualifiers;
}

function buildPrQualifiers(options: SearchOptions): string[] {
  const qualifiers: string[] = ["is:pr"];

  if (options.repo) qualifiers.push(`repo:${options.repo}`);

  if (options.state && options.state !== "all") {
    if (options.state === "merged") {
      qualifiers.push("is:merged");
    } else {
      qualifiers.push(`state:${options.state}`);
    }
  }

  if (options.language) qualifiers.push(`language:${options.language}`);
  if (options.author) qualifiers.push(`author:${options.author}`);

  return qualifiers;
}

function buildRepoQualifiers(options: SearchOptions): string[] {
  const qualifiers: string[] = [];
  if (options.language) qualifiers.push(`language:${options.language}`);
  return qualifiers;
}

function buildCodeQualifiers(options: SearchOptions): string[] {
  const qualifiers: string[] = [];

  if (options.repo) qualifiers.push(`repo:${options.repo}`);
  if (options.language) qualifiers.push(`language:${options.language}`);

  return qualifiers;
}

function buildCommitQualifiers(options: SearchOptions): string[] {
  const qualifiers: string[] = [];

  if (options.repo) qualifiers.push(`repo:${options.repo}`);
  if (options.author) qualifiers.push(`author:${options.author}`);

  return qualifiers;
}

const search = {
  issues: async (
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<IssueSearchItem>> => {
    const qualifiers = buildIssueQualifiers(options);

    const endpoint = searchIssuesEndpoint(query, qualifiers, {
      sort: options.sort,
      order: options.order,
      perPage: options.limit,
    });

    return client.getSearchPaginated(endpoint, normalizeIssueSearchItem);
  },

  prs: async (
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<IssueSearchItem>> => {
    const qualifiers = buildPrQualifiers(options);

    const endpoint = searchIssuesEndpoint(query, qualifiers, {
      sort: options.sort,
      order: options.order,
      perPage: options.limit,
    });

    return client.getSearchPaginated(endpoint, normalizeIssueSearchItem);
  },

  repos: async (
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<RepoSearchItem>> => {
    const qualifiers = buildRepoQualifiers(options);

    const endpoint = searchReposEndpoint(query, qualifiers, {
      sort: options.sort,
      order: options.order,
      perPage: options.limit,
    });

    return client.getSearchPaginated(endpoint, normalizeRepoSearchItem);
  },

  code: async (
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<CodeSearchItem>> => {
    const qualifiers = buildCodeQualifiers(options);

    const endpoint = searchCodeEndpoint(query, qualifiers, {
      sort: options.sort,
      perPage: options.limit,
    });

    return client.getSearchPaginated(endpoint, normalizeCodeSearchItem);
  },

  commits: async (
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<CommitSearchItem>> => {
    const qualifiers = buildCommitQualifiers(options);

    const endpoint = searchCommitsEndpoint(query, qualifiers, {
      sort: options.sort,
      order: options.order,
      perPage: options.limit,
    });

    return client.getSearchPaginated(endpoint, normalizeCommitSearchItem);
  },
};

export default search;
export type { SearchOptions };
