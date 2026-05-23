import config from "@/core/config";

import {
  AuthError,
  GhitgudError,
  NotFoundError,
  RateLimitError,
  TokenRequiredError,
  UnprocessableError,
} from "@/core/errors";

import {
  STATUS_OK_MIN,
  STATUS_OK_MAX,
  ERROR_NOT_FOUND,
  ERROR_UNEXPECTED,
  DEFAULT_PER_PAGE,
  STATUS_FORBIDDEN,
  STATUS_NOT_FOUND,
  GITHUB_API_ACCEPT,
  GITHUB_API_VERSION,
  ERROR_UNAUTHORIZED,
  GITHUB_API_BASE_URL,
  ERROR_UNPROCESSABLE,
  STATUS_UNAUTHORIZED,
  STATUS_RATE_LIMITED,
  STATUS_UNPROCESSABLE,
  ERROR_RATE_LIMIT_AUTHENTICATED,
  ERROR_RATE_LIMIT_UNAUTHENTICATED,
} from "@/core/constants";

interface RequestOptions {
  body?: unknown;
  method?: string;
  tokenRequired?: boolean;
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

interface RateLimitInfo {
  limit: number;
  resetAt: Date;
  remaining: number;
}

function parseRateLimitHeaders(response: Response): RateLimitInfo | null {
  const limit = response.headers.get("x-ratelimit-limit");
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");

  if (!limit || !remaining || !reset) return null;

  return {
    limit: Number(limit),
    remaining: Number(remaining),
    resetAt: new Date(Number(reset) * 1000),
  };
}

function isRateLimitError(response: Response): boolean {
  const rateLimit = parseRateLimitHeaders(response);
  if (!rateLimit) return false;

  return response.status === STATUS_FORBIDDEN && rateLimit.remaining === 0;
}

function handleRateLimit(response: Response): never {
  const rateLimit = parseRateLimitHeaders(response);
  const hasToken = !!config.getTokenOptional();

  if (!rateLimit) {
    throw new GhitgudError(ERROR_UNEXPECTED);
  }

  const message = hasToken
    ? ERROR_RATE_LIMIT_AUTHENTICATED
    : ERROR_RATE_LIMIT_UNAUTHENTICATED;

  throw new RateLimitError(
    message,
    rateLimit.resetAt,
    rateLimit.remaining,
    rateLimit.limit,
  );
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: GITHUB_API_ACCEPT,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };

  const tokenValue = token ?? config.getTokenOptional();
  if (tokenValue) {
    headers.Authorization = `Bearer ${tokenValue}`;
  }

  return headers;
}

function handleError(
  status: number,
  response?: Response,
  tokenRequired?: boolean,
): never {
  if (status === STATUS_UNAUTHORIZED && tokenRequired) {
    throw new TokenRequiredError(
      "This operation requires a token with appropriate scopes.",
    );
  }

  if (response && isRateLimitError(response)) {
    handleRateLimit(response);
  }

  if (status === STATUS_RATE_LIMITED) {
    if (response) handleRateLimit(response);
    throw new GhitgudError("Rate limit exceeded.");
  }

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
  if (options.tokenRequired && !config.getTokenOptional()) {
    throw new TokenRequiredError(
      "This operation requires a token with appropriate scopes.",
    );
  }

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
  handleError(response.status, response, options.tokenRequired);
}

async function request(
  endpoint: string,
  options: RequestOptions = {},
  token?: string,
): Promise<Response> {
  const url = `${GITHUB_API_BASE_URL}${endpoint}`;
  return requestUrl(url, options, token);
}

async function requestTokenRequired(
  endpoint: string,
  options: RequestOptions = {},
  token?: string,
): Promise<Response> {
  return request(endpoint, { ...options, tokenRequired: true }, token);
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
  getTokenRequired: (endpoint: string) => requestTokenRequired(endpoint),
  getPaginated: <T>(endpoint: string) => getPaginated<T>(endpoint),

  post: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "POST", body }),

  postTokenRequired: (endpoint: string, body: unknown) =>
    requestTokenRequired(endpoint, { method: "POST", body }),

  patch: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "PATCH", body }),

  patchTokenRequired: (endpoint: string, body: unknown) =>
    requestTokenRequired(endpoint, { method: "PATCH", body }),

  put: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "PUT", body }),

  putTokenRequired: (endpoint: string, body: unknown) =>
    requestTokenRequired(endpoint, { method: "PUT", body }),

  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),

  deleteTokenRequired: (endpoint: string) =>
    requestTokenRequired(endpoint, { method: "DELETE" }),

  getRepo: () => config.getRepo(),
  validateToken: (token: string) => request("/user", {}, token),
  isOk: (status: number) => isSuccessful(status),
  isNotFound: (status: number) => status === STATUS_NOT_FOUND,
  getDefaultPerPage: () => DEFAULT_PER_PAGE,
  hasToken: () => !!config.getTokenOptional(),
};

export default client;
