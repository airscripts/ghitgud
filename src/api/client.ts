import config from "@/core/config";

import {
  AuthError,
  GhitgudError,
  NotFoundError,
  UnprocessableError,
} from "@/core/errors";

import {
  STATUS_OK_MIN,
  STATUS_OK_MAX,
  ERROR_NOT_FOUND,
  ERROR_UNEXPECTED,
  DEFAULT_PER_PAGE,
  STATUS_NOT_FOUND,
  GITHUB_API_ACCEPT,
  GITHUB_API_VERSION,
  ERROR_UNAUTHORIZED,
  GITHUB_API_BASE_URL,
  ERROR_UNPROCESSABLE,
  STATUS_UNAUTHORIZED,
  STATUS_UNPROCESSABLE,
} from "@/core/constants";

interface RequestOptions {
  method?: string;
  body?: unknown;
}

const ERROR_MAP: Record<number, typeof GhitgudError> = {
  [STATUS_UNAUTHORIZED]: AuthError,
  [STATUS_NOT_FOUND]: NotFoundError,
  [STATUS_UNPROCESSABLE]: UnprocessableError,
};

const ERROR_MESSAGES: Record<number, string> = {
  [STATUS_UNAUTHORIZED]: ERROR_UNAUTHORIZED,
  [STATUS_NOT_FOUND]: ERROR_NOT_FOUND,
  [STATUS_UNPROCESSABLE]: ERROR_UNPROCESSABLE,
};

function buildHeaders(token?: string): Record<string, string> {
  return {
    Accept: GITHUB_API_ACCEPT,
    Authorization: `Bearer ${token ?? config.getToken()}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

function handleError(status: number): never {
  const ErrorClass = ERROR_MAP[status];
  if (ErrorClass) throw new ErrorClass(ERROR_MESSAGES[status]);
  throw new GhitgudError(`${ERROR_UNEXPECTED}: ${status}`);
}

function isSuccessful(status: number): boolean {
  return status >= STATUS_OK_MIN && status <= STATUS_OK_MAX;
}

function getNextPageUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;

  const links = linkHeader.split(",");
  const nextLink = links.find((link) => link.includes('rel="next"'));

  if (!nextLink) return null;

  const match = nextLink.match(/<([^>]+)>/);
  return match?.[1] ?? null;
}

async function requestUrl(
  url: string,
  options: RequestOptions = {},
  token?: string,
): Promise<Response> {
  const headers = buildHeaders(token);

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  if (isSuccessful(response.status)) return response;
  handleError(response.status);
}

async function request(
  endpoint: string,
  options: RequestOptions = {},
  token?: string,
): Promise<Response> {
  const url = `${GITHUB_API_BASE_URL}${endpoint}`;
  return requestUrl(url, options, token);
}

async function getPaginated<T>(endpoint: string): Promise<T[]> {
  let nextUrl: string | null = `${GITHUB_API_BASE_URL}${endpoint}`;
  const results: T[] = [];

  while (nextUrl) {
    const response = await requestUrl(nextUrl);
    const data = (await response.json()) as T[];
    results.push(...data);
    nextUrl = getNextPageUrl(response.headers.get("link"));
  }

  return results;
}

const client = {
  get: (endpoint: string) => request(endpoint),
  getPaginated: <T>(endpoint: string) => getPaginated<T>(endpoint),

  post: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "POST", body }),

  patch: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "PATCH", body }),

  put: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "PUT", body }),

  getRepo: () => config.getRepo(),
  validateToken: (token: string) => request("/user", {}, token),
  isOk: (status: number) => isSuccessful(status),
  isNotFound: (status: number) => status === STATUS_NOT_FOUND,
  getDefaultPerPage: () => DEFAULT_PER_PAGE,
  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),
};

export default client;
