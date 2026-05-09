import { describe, it, expect } from "vitest";

import {
  GhitgudError,
  AuthError,
  ConfigError,
  NotFoundError,
  UnprocessableError,
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
});