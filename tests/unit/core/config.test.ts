import fs from "fs";
import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  ERROR_NO_REPO,
  GHITGUD_FOLDER,
  ERROR_NO_TOKEN,
  CREDENTIALS_FILE,
} from "@/core/constants";

const originalEnv = { ...process.env };
const credentialsPath = path.join(GHITGUD_FOLDER, CREDENTIALS_FILE);

describe("config", () => {
  beforeEach(() => {
    delete process.env.GHITGUD_GITHUB_REPO;
    delete process.env.GHITGUD_GITHUB_TOKEN;

    if (fs.existsSync(GHITGUD_FOLDER)) {
      fs.rmSync(GHITGUD_FOLDER, { recursive: true });
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (fs.existsSync(GHITGUD_FOLDER)) {
      fs.rmSync(GHITGUD_FOLDER, { recursive: true });
    }
  });

  describe("getRepo", () => {
    it("should throw when not set", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(() => config.getRepo()).toThrow(ERROR_NO_REPO);
    });

    it("should return value from environment variable", async () => {
      process.env.GHITGUD_GITHUB_REPO = "owner/repo";
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(config.getRepo()).toBe("owner/repo");
    });

    it("should return value from credentials file", async () => {
      fs.mkdirSync(GHITGUD_FOLDER, { recursive: true });
      fs.writeFileSync(credentialsPath, JSON.stringify({ repo: "owner/repo" }));
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(config.getRepo()).toBe("owner/repo");
    });
  });

  describe("getToken", () => {
    it("should throw when not set", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(() => config.getToken()).toThrow(ERROR_NO_TOKEN);
    });

    it("should return value from environment variable", async () => {
      process.env.GHITGUD_GITHUB_TOKEN = "my-token";
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(config.getToken()).toBe("my-token");
    });
  });

  describe("write and read", () => {
    it("should write and read a config value", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");

      config.write("token", "test-token");
      vi.resetModules();

      const { default: config2 } = await import("@/core/config");
      const value = config2.read("token");
      expect(value).toBe("test-token");
    });

    it("should return null for non-existent key", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      const value = config.read("nonexistent");
      expect(value).toBeNull();
    });
  });

  describe("has", () => {
    it("should return true when env var is set", async () => {
      process.env.GHITGUD_GITHUB_REPO = "owner/repo";
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(config.has("repo")).toBe(true);
    });

    it("should return false when not set anywhere", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(config.has("repo")).toBe(false);
    });
  });
});
