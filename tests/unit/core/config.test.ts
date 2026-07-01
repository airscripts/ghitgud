import fs from "fs";
import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("os", () => ({
  default: {
    homedir: () => "/tmp/gitfleet-home",
  },
}));

import git from "@/core/git";

import {
  ERROR_NO_TOKEN,
  GITFLEET_FOLDER,
  GITFLEET_RC_FILE,
  CREDENTIALS_FILE,
} from "@/core/constants";

vi.mock("@/core/git", () => ({
  default: {
    getRepoRoot: vi.fn(() => {
      throw new Error("no repo");
    }),

    getRemoteUrl: vi.fn(),
    parseRepoFromRemoteUrl: vi.fn(),
  },
}));

const originalEnv = { ...process.env };
const TEST_HOME = "/tmp/gitfleet-home";
const credentialsPath = path.join(GITFLEET_FOLDER, CREDENTIALS_FILE);
const repoRoot = path.join(TEST_HOME, ".config", "gitfleet", "repo");
const repoRcPath = path.join(repoRoot, GITFLEET_RC_FILE);

describe("config", () => {
  beforeEach(() => {
    delete process.env.GITFLEET_GITHUB_TOKEN;
    delete process.env.GITFLEET_PROFILE;

    if (fs.existsSync(GITFLEET_FOLDER)) {
      fs.rmSync(GITFLEET_FOLDER, { recursive: true });
    }

    (git.getRepoRoot as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("no repo");
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (fs.existsSync(GITFLEET_FOLDER)) {
      fs.rmSync(GITFLEET_FOLDER, { recursive: true });
    }

    vi.restoreAllMocks();
  });

  describe("getToken", () => {
    it("should throw when not set", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(() => config.getToken()).toThrow(ERROR_NO_TOKEN);
    });

    it("should return value from environment variable", async () => {
      process.env.GITFLEET_GITHUB_TOKEN = "my-token";
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

    it("should write credentials with private file permissions", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      config.write("token", "test-token");

      if (process.platform === "win32") {
        return;
      }

      const mode = fs.statSync(credentialsPath).mode & 0o777;
      expect(mode).toBe(0o600);
    });

    it("should reject pre-profile credential shapes", async () => {
      fs.mkdirSync(GITFLEET_FOLDER, { recursive: true });

      fs.writeFileSync(
        credentialsPath,
        JSON.stringify({ token: "legacy-token" }),
      );

      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(() => config.write("token", "new-token")).toThrow(
        "Invalid credentials file.",
      );
    });

    it("should return null for non-existent key", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      const value = config.read("nonexistent");
      expect(value).toBeNull();
    });
  });

  describe("profiles", () => {
    it("should add and list named profiles", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");

      config.addProfile("work", {
        token: "work-token",
      });

      const profiles = config.listProfiles();
      expect(profiles).toEqual([
        {
          name: "work",
          hasToken: true,
          active: true,
        },
      ]);
    });

    it("should resolve repo-local profiles before the active profile", async () => {
      fs.mkdirSync(repoRoot, { recursive: true });
      fs.writeFileSync(repoRcPath, JSON.stringify({ profile: "work" }));
      fs.mkdirSync(GITFLEET_FOLDER, { recursive: true });

      fs.writeFileSync(
        credentialsPath,
        JSON.stringify({
          activeProfile: "default",
          profiles: {
            default: {
              token: "default-token",
            },
            work: {
              token: "work-token",
            },
          },
        }),
      );

      (git.getRepoRoot as ReturnType<typeof vi.fn>).mockReturnValue(repoRoot);

      vi.resetModules();
      const { default: config } = await import("@/core/config");

      expect(config.getToken()).toBe("work-token");
    });

    it("should resolve the stored active profile when no repo-local profile is set", async () => {
      fs.mkdirSync(GITFLEET_FOLDER, { recursive: true });

      fs.writeFileSync(
        credentialsPath,
        JSON.stringify({
          activeProfile: "work",
          profiles: {
            default: {
              token: "default-token",
            },
            work: {
              token: "work-token",
            },
          },
        }),
      );

      vi.resetModules();
      const { default: config } = await import("@/core/config");

      expect(config.getToken()).toBe("work-token");
    });

    it("should set the active profile explicitly", async () => {
      fs.mkdirSync(GITFLEET_FOLDER, { recursive: true });
      fs.writeFileSync(
        credentialsPath,
        JSON.stringify({
          activeProfile: "default",
          profiles: {
            default: {
              token: "default-token",
            },
            work: {
              token: "work-token",
            },
          },
        }),
      );

      vi.resetModules();
      const { default: config } = await import("@/core/config");

      config.setActiveProfile("work");
      expect(config.getToken()).toBe("work-token");
    });
  });

  describe("has", () => {
    it("should return true when env var is set", async () => {
      process.env.GITFLEET_GITHUB_TOKEN = "my-token";
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(config.has("token")).toBe(true);
    });

    it("should return false when not set anywhere", async () => {
      vi.resetModules();
      const { default: config } = await import("@/core/config");
      expect(config.has("token")).toBe(false);
    });
  });
});
