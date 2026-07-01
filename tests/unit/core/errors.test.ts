import { describe, it, expect } from "vitest";

import {
  GitfleetError,
  AuthError,
  ConfigError,
  NotFoundError,
  RateLimitError,
  UnprocessableError,
  TokenRequiredError,
} from "@/core/errors";

describe("errors", () => {
  it("GitfleetError should have correct name and message", () => {
    const error = new GitfleetError("test");
    expect(error.name).toBe("GitfleetError");
    expect(error.message).toBe("test");
    expect(error).toBeInstanceOf(Error);
  });

  it("AuthError should extend GitfleetError", () => {
    const error = new AuthError("unauthorized");
    expect(error.name).toBe("AuthError");
    expect(error.message).toBe("unauthorized");
    expect(error).toBeInstanceOf(GitfleetError);
  });

  it("ConfigError should extend GitfleetError", () => {
    const error = new ConfigError("missing config");
    expect(error.name).toBe("ConfigError");
    expect(error.message).toBe("missing config");
    expect(error).toBeInstanceOf(GitfleetError);
  });

  it("NotFoundError should extend GitfleetError", () => {
    const error = new NotFoundError("not found");
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("not found");
    expect(error).toBeInstanceOf(GitfleetError);
  });

  it("UnprocessableError should extend GitfleetError", () => {
    const error = new UnprocessableError("unprocessable");
    expect(error.name).toBe("UnprocessableError");
    expect(error.message).toBe("unprocessable");
    expect(error).toBeInstanceOf(GitfleetError);
  });

  it("RateLimitError should extend GitfleetError with rate limit info", () => {
    const resetAt = new Date("2024-01-15T12:00:00Z");
    const error = new RateLimitError("rate limited", resetAt, 10, 5000);

    expect(error.name).toBe("RateLimitError");
    expect(error.message).toBe("rate limited");
    expect(error).toBeInstanceOf(GitfleetError);
    expect(error.resetAt).toBe(resetAt);
    expect(error.remaining).toBe(10);
    expect(error.limit).toBe(5000);
  });

  it("TokenRequiredError should extend GitfleetError with scopes", () => {
    const error = new TokenRequiredError("token required", ["repo", "user"]);

    expect(error.name).toBe("TokenRequiredError");
    expect(error.message).toBe("token required");
    expect(error).toBeInstanceOf(GitfleetError);
    expect(error.scopes).toEqual(["repo", "user"]);
  });

  it("TokenRequiredError should default to empty scopes", () => {
    const error = new TokenRequiredError("token required");
    expect(error.scopes).toEqual([]);
  });
});
