import logger from "@/core/logger";
import { ConfigError } from "@/core/errors";
import configService from "@/services/config";
import { ERROR_UNSUPPORTED_KEY } from "@/core/constants";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/core/config", () => ({
  default: {
    write: vi.fn(),
    read: vi.fn(),
    unset: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderSummary: vi.fn(),
  },
}));

describe("config service", () => {
  beforeEach(() => {
    vi.spyOn(logger, "start").mockImplementation(() => {});
    vi.spyOn(logger, "success").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("set", () => {
    it("should throw ConfigError for unsupported key", () => {
      expect(() => configService.set("token", "my-token")).toThrow(ConfigError);

      expect(() => configService.set("token", "my-token")).toThrow(
        ERROR_UNSUPPORTED_KEY,
      );
    });
  });

  describe("get", () => {
    it("should throw ConfigError for unsupported key", () => {
      expect(() => configService.get("token")).toThrow(ConfigError);
    });
  });

  describe("unset", () => {
    it("should throw ConfigError for unsupported key", () => {
      expect(() => configService.unset("token")).toThrow(ConfigError);
    });
  });
});
