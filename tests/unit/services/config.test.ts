import config from "@/core/config";
import output from "@/core/output";
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
    it("should set a valid config key", () => {
      const result = configService.set("token", "my-token");
      expect(result).toEqual({ success: true });
      expect(config.write).toHaveBeenCalledWith("token", "my-token");
      expect(logger.success).toHaveBeenCalledWith(
        'Config "token" set successfully.',
      );
    });

    it("should set repo config key", () => {
      const result = configService.set("repo", "owner/repo");
      expect(result).toEqual({ success: true });
      expect(config.write).toHaveBeenCalledWith("repo", "owner/repo");
    });

    it("should throw ConfigError for unsupported key", () => {
      expect(() => configService.set("invalid", "value")).toThrow(ConfigError);
      expect(() => configService.set("invalid", "value")).toThrow(
        ERROR_UNSUPPORTED_KEY,
      );
    });
  });

  describe("get", () => {
    it("should get a config key with value", () => {
      (config.read as ReturnType<typeof vi.fn>).mockReturnValue("my-token");
      const result = configService.get("token");

      expect(result).toEqual({
        success: true,
        key: "token",
        value: "my-token",
      });

      expect(output.renderSummary).toHaveBeenCalledWith("Configuration", [
        ["token", "my-token"],
      ]);
    });

    it("should return null for missing value", () => {
      (config.read as ReturnType<typeof vi.fn>).mockReturnValue(null);
      const result = configService.get("token");
      expect(result).toEqual({ success: true, key: "token", value: null });

      expect(output.renderSummary).toHaveBeenCalledWith("Configuration", [
        ["token", "(not set)"],
      ]);
    });

    it("should throw ConfigError for unsupported key", () => {
      expect(() => configService.get("invalid")).toThrow(ConfigError);
    });
  });

  describe("unset", () => {
    it("should unset a config key", () => {
      (config.read as ReturnType<typeof vi.fn>).mockReturnValue("my-token");
      const result = configService.unset("token");

      expect(result).toEqual({ success: true });
      expect(config.unset).toHaveBeenCalledWith("token");

      expect(logger.success).toHaveBeenCalledWith(
        'Config "token" unset successfully.',
      );
    });

    it("should throw ConfigError for non-set key", () => {
      (config.read as ReturnType<typeof vi.fn>).mockReturnValue(null);
      expect(() => configService.unset("token")).toThrow(ConfigError);
    });
  });
});
