import client from "@/providers/github/client";
import { SEARCH_MAX_PER_PAGE } from "@/core/constants";

interface CodeSearchOptions {
  repo?: string;
  language?: string;
  perPage?: number;
}

const search = (
  query: string,
  options: CodeSearchOptions = {},
): Promise<Response> => {
  const params = new URLSearchParams();
  const qualifiers: string[] = [];
  if (options.repo) qualifiers.push(`repo:${options.repo}`);
  if (options.language) qualifiers.push(`language:${options.language}`);
  const fullQuery = [query, ...qualifiers].join(" ");
  params.set("q", fullQuery);
  params.set("per_page", String(options.perPage ?? SEARCH_MAX_PER_PAGE));
  return client.getTokenRequired(`/search/code?${params.toString()}`);
};

const definitions = (
  symbol: string,
  options: { repo?: string; perPage?: number } = {},
): Promise<Response> => {
  const params = new URLSearchParams();
  const qualifiers: string[] = [];
  if (options.repo) qualifiers.push(`repo:${options.repo}`);
  const fullQuery = [`${symbol} in:file`, ...qualifiers].join(" ");
  params.set("q", fullQuery);
  params.set("per_page", String(options.perPage ?? SEARCH_MAX_PER_PAGE));
  return client.getTokenRequired(`/search/code?${params.toString()}`);
};

const references = (
  symbol: string,
  options: { repo?: string; perPage?: number } = {},
): Promise<Response> => {
  const params = new URLSearchParams();
  const qualifiers: string[] = [];
  if (options.repo) qualifiers.push(`repo:${options.repo}`);
  const fullQuery = [`${symbol}`, ...qualifiers].join(" ");
  params.set("q", fullQuery);
  params.set("per_page", String(options.perPage ?? SEARCH_MAX_PER_PAGE));
  return client.getTokenRequired(`/search/code?${params.toString()}`);
};

const fileContents = (
  repo: string,
  path: string,
  ref?: string,
): Promise<Response> => {
  const params = new URLSearchParams();
  if (ref) params.set("ref", ref);
  const query = params.toString();
  return client.getTokenRequired(
    `/repos/${repo}/contents/${encodeURIComponent(path)}${query ? `?${query}` : ""}`,
  );
};

const blameCommits = (
  repo: string,
  path: string,
  options: { perPage?: number } = {},
): Promise<Response> => {
  const params = new URLSearchParams();
  params.set("path", path);
  params.set("per_page", String(options.perPage ?? 30));
  return client.getTokenRequired(`/repos/${repo}/commits?${params.toString()}`);
};

const commitPrs = (repo: string, sha: string): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/commits/${sha}/pulls`);

export default {
  search,
  definitions,
  references,
  fileContents,
  blameCommits,
  commitPRs: commitPrs,
};
