import { execFileSync } from "child_process";

import client from "@/api/client";
import output from "@/core/output";
import { GitfleetError } from "@/core/errors";

const JQ_NOT_FOUND =
  "jq is not installed. Install it from https://jqlang.org/ and try again.";

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const METHODS = new Set<ApiMethod>(["GET", "POST", "PUT", "PATCH", "DELETE"]);

const parseFields = (fields: string[]): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const field of fields) {
    const separator = field.indexOf("=");
    if (separator <= 0) throw new GitfleetError(`Invalid API field: ${field}.`);
    const key = field.slice(0, separator).trim();
    if (!key || key in result)
      throw new GitfleetError(`Duplicate or empty API field: ${key}.`);
    result[key] = field.slice(separator + 1);
  }
  return result;
};

const validateEndpoint = (endpoint: string): string => {
  if (/^https?:\/\//i.test(endpoint) || endpoint.startsWith("//")) {
    throw new GitfleetError(
      "API endpoint must be a relative provider API path.",
    );
  }
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
};

const readResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) return JSON.parse(text) as unknown;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const request = async (
  endpoint: string,
  options: {
    method?: string;
    fields?: string[];
    paginate?: boolean;
    jq?: string;
    silent?: boolean;
  },
) => {
  if (options.silent && options.jq) {
    throw new GitfleetError("--silent cannot be combined with --jq.");
  }
  const fields = parseFields(options.fields ?? []);
  const method = (
    options.method ?? (Object.keys(fields).length ? "POST" : "GET")
  ).toUpperCase() as ApiMethod;
  if (!METHODS.has(method))
    throw new GitfleetError(`Unsupported API method: ${method}.`);
  if (options.paginate && method !== "GET") {
    throw new GitfleetError(
      "API pagination is only supported for GET requests.",
    );
  }

  const path = validateEndpoint(endpoint);
  let response = await client.requestTokenRequired(path, {
    method,
    ...(Object.keys(fields).length ? { body: fields } : {}),
  });
  let value = await readResponse(response);

  if (options.paginate) {
    if (!Array.isArray(value)) {
      throw new GitfleetError(
        "Paginated API responses must be top-level arrays.",
      );
    }
    const combined: unknown[] = [...value];
    let next = response.headers
      .get("link")
      ?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    while (next) {
      if (!next.startsWith("https://api.github.com/")) {
        throw new GitfleetError(
          "GitHub pagination returned an unexpected URL.",
        );
      }
      response = await client.requestUrlTokenRequired(next, { method: "GET" });
      const page = await readResponse(response);
      if (!Array.isArray(page)) {
        throw new GitfleetError(
          "Paginated API responses must be top-level arrays.",
        );
      }
      combined.push(...page);
      next = response.headers
        .get("link")
        ?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    }
    value = combined;
  }

  if (options.jq) {
    try {
      const input = JSON.stringify(value);
      const stdout = execFileSync("jq", [options.jq], {
        input,
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      });
      const parsed = JSON.parse(stdout) as unknown;
      value = Array.isArray(parsed) && parsed.length === 1 ? parsed[0] : parsed;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        throw new GitfleetError(JQ_NOT_FOUND);
      }
      const message =
        error instanceof Error && "stderr" in error
          ? (error as { stderr: string | Buffer }).stderr.toString().trim() ||
            error.message
          : String(error);
      throw new GitfleetError(`jq filter failed: ${message}.`);
    }
  }

  if (!options.silent) output.writeValue(value);
  return { success: true, status: response.status, data: value };
};

export default { request };
export { parseFields, validateEndpoint };
