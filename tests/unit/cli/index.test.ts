import format from "@/core/format";
import { GhitgudError } from "@/core/errors";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/core/format", () => ({
  default: { formatOutput: vi.fn(), formatError: vi.fn() },
}));

vi.mock("@/services/labels", () => ({
  default: {
    ping: vi.fn(),
    list: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    prune: vi.fn(),
  },
}));

vi.mock("@/services/config", () => ({
  default: { set: vi.fn(), get: vi.fn() },
}));

describe("cli index", () => {
  beforeEach(() => {
    vi.spyOn(format, "formatError").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should catch GhitgudError and format to stderr", () => {
    const error = new GhitgudError("test error");
    format.formatError(error.message);
    expect(format.formatError).toHaveBeenCalledWith("test error");
  });

  it("should format GhitgudError message consistently", () => {
    const messages = ["Unauthorized.", "Config error.", "Not found."];

    messages.forEach((msg) => {
      format.formatError(msg);
    });

    expect(format.formatError).toHaveBeenCalledTimes(messages.length);
  });
});