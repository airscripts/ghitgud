import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/core/logger", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
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
    vi.spyOn(logger, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should catch GhitgudError and log to stderr", () => {
    const error = new GhitgudError("test error");
    logger.error(error.message);
    expect(logger.error).toHaveBeenCalledWith("test error");
  });

  it("should format GhitgudError message consistently", () => {
    const messages = ["Unauthorized.", "Config error.", "Not found."];
    messages.forEach((msg) => {
      logger.error(msg);
    });

    expect(logger.error).toHaveBeenCalledTimes(messages.length);
  });
});
