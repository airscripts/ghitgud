import config from "@/core/config";
import {
  GhitgudError,
  AuthError,
  NotFoundError,
  UnprocessableError,
} from "@/core/errors";

import {
  GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
  GITHUB_API_ACCEPT,
  STATUS_OK_MIN,
  STATUS_OK_MAX,
  STATUS_UNAUTHORIZED,
  STATUS_NOT_FOUND,
  STATUS_UNPROCESSABLE,
  ERROR_UNAUTHORIZED,
  ERROR_NOT_FOUND,
  ERROR_UNPROCESSABLE,
  ERROR_UNEXPECTED,
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

function buildHeaders(): Record<string, string> {
  return {
    Accept: GITHUB_API_ACCEPT,
    Authorization: `Bearer ${config.getToken()}`,
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

async function request(
  endpoint: string,
  options: RequestOptions = {},
): Promise<Response> {
  const url = `${GITHUB_API_BASE_URL}${endpoint}`;
  const headers = buildHeaders();

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

const client = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "POST", body }),
  patch: (endpoint: string, body: unknown) =>
    request(endpoint, { method: "PATCH", body }),
  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),

  getRepo: () => config.getRepo(),
  isOk: (status: number) => isSuccessful(status),
  isNotFound: (status: number) => status === STATUS_NOT_FOUND,
};

export default client;
