import { describe, it, expect } from "vitest";

import {
  GhitgudError,
  AuthError,
  ConfigError,
  NotFoundError,
  RateLimitError,
  UnprocessableError,
  TokenRequiredError,
} from "@/core/errors";

describe("errors", () => {
  it("GhitgudError should have correct name and message", () => {
    const error = new GhitgudError("test");
    expect(error.name).toBe("GhitgudError");
    expect(error.message).toBe("test");
    expect(error).toBeInstanceOf(Error);
  });

  it("AuthError should extend GhitgudError", () => {
    const error = new AuthError("unauthorized");
    expect(error.name).toBe("AuthError");
    expect(error.message).toBe("unauthorized");
    expect(error).toBeInstanceOf(GhitgudError);
  });

  it("ConfigError should extend GhitgudError", () => {
    const error = new ConfigError("missing config");
    expect(error.name).toBe("ConfigError");
    expect(error.message).toBe("missing config");
    expect(error).toBeInstanceOf(GhitgudError);
  });

  it("NotFoundError should extend GhitgudError", () => {
    const error = new NotFoundError("not found");
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("not found");
    expect(error).toBeInstanceOf(GhitgudError);
  });

  it("UnprocessableError should extend GhitgudError", () => {
    const error = new UnprocessableError("unprocessable");
    expect(error.name).toBe("UnprocessableError");
    expect(error.message).toBe("unprocessable");
    expect(error).toBeInstanceOf(GhitgudError);
  });

  it("RateLimitError should extend GhitgudError with rate limit info", () => {
    const resetAt = new Date("2024-01-15T12:00:00Z");
    const error = new RateLimitError("rate limited", resetAt, 10, 5000);

    expect(error.name).toBe("RateLimitError");
    expect(error.message).toBe("rate limited");
    expect(error).toBeInstanceOf(GhitgudError);
    expect(error.resetAt).toBe(resetAt);
    expect(error.remaining).toBe(10);
    expect(error.limit).toBe(5000);
  });

  it("TokenRequiredError should extend GhitgudError with scopes", () => {
    const error = new TokenRequiredError("token required", ["repo", "user"]);

    expect(error.name).toBe("TokenRequiredError");
    expect(error.message).toBe("token required");
    expect(error).toBeInstanceOf(GhitgudError);
    expect(error.scopes).toEqual(["repo", "user"]);
  });

  it("TokenRequiredError should default to empty scopes", () => {
    const error = new TokenRequiredError("token required");
    expect(error.scopes).toEqual([]);
  });
});
