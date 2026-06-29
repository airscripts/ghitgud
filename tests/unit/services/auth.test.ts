import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import git from "@/core/git";
import authApi from "@/api/auth";
import config from "@/core/config";
import output from "@/core/output";
import logger from "@/core/logger";
import authService from "@/services/auth";
import { ConfigError } from "@/core/errors";

import {
  ERROR_AUTH_FAILED,
  ERROR_NO_REMOTE_URL,
  ERROR_AUTH_NO_TOKEN,
  INFO_AUTH_LOGGED_OUT,
  DEFAULT_PROFILE_NAME,
  ERROR_PROFILE_NOT_FOUND,
} from "@/core/constants";

vi.mock("@/api/auth", () => ({
  default: {
    fetchAuthenticatedUser: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    write: vi.fn(),
    unset: vi.fn(),
    addProfile: vi.fn(),
    getProfile: vi.fn(),
    setActiveProfile: vi.fn(),
    setRepoLocalProfile: vi.fn(),
    listProfiles: vi.fn(() => []),
    getTokenOptional: vi.fn(() => "ghp_test"),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderList: vi.fn(),
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
    renderSection: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    start: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/core/output-state", () => ({
  default: {
    isHumanOutput: vi.fn(() => true),
    isJsonOutput: vi.fn(() => false),
  },
}));

vi.mock("@/core/git", () => ({
  default: {
    getRemoteUrl: vi.fn(),
    parseRepoFromRemoteUrl: vi.fn(),
  },
}));

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("logs in and creates default profile when none exist", async () => {
      (config.listProfiles as ReturnType<typeof vi.fn>).mockReturnValue([]);

      (
        authApi.fetchAuthenticatedUser as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        user: {
          name: "Octocat",
          login: "octocat",
          htmlUrl: "https://github.com/octocat",
          avatarUrl: "https://github.com/images/error/octocat.png",
        },

        scopes: ["repo"],
      });

      const result = await authService.login("ghp_test123");

      expect(result.success).toBe(true);
      expect(result.user.login).toBe("octocat");
      expect(result.scopes).toEqual(["repo"]);
      expect(result.profile).toBe(DEFAULT_PROFILE_NAME);

      expect(config.addProfile).toHaveBeenCalledWith(DEFAULT_PROFILE_NAME, {
        token: "ghp_test123",
      });

      expect(logger.success).toHaveBeenCalledWith(
        "Logged in as octocat (Octocat).",
      );
    });

    it("logs in and updates existing profile token", async () => {
      (config.listProfiles as ReturnType<typeof vi.fn>).mockReturnValue([
        { name: "default", active: true, hasToken: true },
      ]);

      (config.getProfile as ReturnType<typeof vi.fn>).mockReturnValue({
        token: "old-token",
      });

      (
        authApi.fetchAuthenticatedUser as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        user: {
          name: null,
          htmlUrl: "",
          avatarUrl: "",
          login: "testuser",
        },

        scopes: [],
      });

      const result = await authService.login("ghp_new123", {
        profile: "default",
      });

      expect(result.success).toBe(true);
      expect(config.write).toHaveBeenCalledWith("token", "ghp_new123");
      expect(config.setActiveProfile).toHaveBeenCalledWith("default");
    });

    it("throws when token is not provided", async () => {
      await expect(authService.login()).rejects.toThrow(ERROR_AUTH_NO_TOKEN);
    });

    it("throws on authentication failure", async () => {
      (
        authApi.fetchAuthenticatedUser as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Unauthorized"));

      await expect(authService.login("bad-token")).rejects.toThrow(
        ERROR_AUTH_FAILED,
      );
    });
  });

  describe("logout", () => {
    it("removes stored token", () => {
      (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(
        "ghp_test123",
      );

      const result = authService.logout();
      expect(result.success).toBe(true);
      expect(config.unset).toHaveBeenCalledWith("token");
      expect(logger.success).toHaveBeenCalledWith(INFO_AUTH_LOGGED_OUT);
    });

    it("throws when no token is configured", () => {
      (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );

      expect(() => authService.logout()).toThrow(ERROR_AUTH_NO_TOKEN);
    });
  });

  describe("status", () => {
    it("shows authentication status", async () => {
      (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(
        "ghp_test123",
      );

      (config.listProfiles as ReturnType<typeof vi.fn>).mockReturnValue([
        { name: "default", active: true, hasToken: true },
      ]);

      (
        authApi.fetchAuthenticatedUser as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        user: {
          htmlUrl: "",
          avatarUrl: "",
          name: "Octocat",
          login: "octocat",
        },

        scopes: ["repo", "read:org"],
      });

      const result = await authService.status();

      expect(result.success).toBe(true);
      expect(result.user.login).toBe("octocat");
      expect(result.scopes).toEqual(["repo", "read:org"]);
      expect(result.profile).toBe("default");

      expect(output.renderSummary).toHaveBeenCalledWith("Authentication", [
        ["User", "octocat"],
        ["Name", "Octocat"],
        ["Profile", "default"],
        ["Scopes", "repo, read:org"],
      ]);
    });

    it("throws when no token is configured", async () => {
      (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );

      await expect(authService.status()).rejects.toThrow(ERROR_AUTH_NO_TOKEN);
    });

    it("throws on authentication failure", async () => {
      (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(
        "bad-token",
      );

      (
        authApi.fetchAuthenticatedUser as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Unauthorized"));

      await expect(authService.status()).rejects.toThrow(ERROR_AUTH_FAILED);
    });
  });

  describe("token", () => {
    it("returns masked token by default", () => {
      (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(
        "ghp_1234567890",
      );

      const result = authService.token(false);
      expect(result.success).toBe(true);
      expect(result.masked).toBe("ghp_...");
      expect(result.token).toBe("ghp_1234567890");
    });

    it("returns raw token with raw flag", () => {
      (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(
        "ghp_1234567890",
      );

      const result = authService.token(true);
      expect(result.success).toBe(true);
      expect(result.masked).toBe("ghp_1234567890");
      expect(result.token).toBe("ghp_1234567890");
    });

    it("throws when no token is configured", () => {
      (config.getTokenOptional as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );

      expect(() => authService.token(false)).toThrow(ERROR_AUTH_NO_TOKEN);
    });
  });

  describe("list", () => {
    it("lists configured profiles", () => {
      (config.listProfiles as ReturnType<typeof vi.fn>).mockReturnValue([
        { name: "default", active: true, hasToken: true },
        { name: "work", active: false, hasToken: true },
      ]);

      const result = authService.list();

      expect(result.success).toBe(true);
      expect(result.profiles).toHaveLength(2);
      expect(output.renderTable).toHaveBeenCalled();
    });
  });

  describe("switch", () => {
    it("switches the active profile after validation", async () => {
      (config.getProfile as ReturnType<typeof vi.fn>).mockReturnValue({
        token: "ghp_test",
      });

      (
        authApi.fetchAuthenticatedUser as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        scopes: ["repo"],
        user: { login: "octocat", name: null, avatarUrl: "", htmlUrl: "" },
      });

      const result = await authService.switch("work");

      expect(result.success).toBe(true);
      expect(result.profile).toBe("work");
      expect(authApi.fetchAuthenticatedUser).toHaveBeenCalledWith("ghp_test");
      expect(config.setActiveProfile).toHaveBeenCalledWith("work");

      expect(logger.success).toHaveBeenCalledWith(
        'Active profile switched to "work".',
      );
    });

    it("throws when switching to a missing profile", async () => {
      (config.getProfile as ReturnType<typeof vi.fn>).mockReturnValue(null);
      await expect(authService.switch("missing")).rejects.toThrow(ConfigError);

      await expect(authService.switch("missing")).rejects.toThrow(
        ERROR_PROFILE_NOT_FOUND,
      );

      expect(config.setActiveProfile).not.toHaveBeenCalled();
    });

    it("throws when switching to a profile without a token", async () => {
      (config.getProfile as ReturnType<typeof vi.fn>).mockReturnValue({});
      await expect(authService.switch("notoken")).rejects.toThrow(ConfigError);
    });
  });

  describe("detect", () => {
    it("detects default profile for the current repository", () => {
      vi.mocked(git.getRemoteUrl).mockReturnValue(
        "https://github.com/owner/repo.git",
      );

      vi.mocked(git.parseRepoFromRemoteUrl).mockReturnValue("owner/repo");
      const result = authService.detect();

      expect(result).toEqual({
        success: true,
        repository: "owner/repo",
        profile: DEFAULT_PROFILE_NAME,
      });

      expect(config.setRepoLocalProfile).toHaveBeenCalledWith(
        DEFAULT_PROFILE_NAME,
      );

      expect(logger.success).toHaveBeenCalledWith(
        `Using profile "${DEFAULT_PROFILE_NAME}" for owner/repo.`,
      );
    });

    it("falls back to default when no remote exists", () => {
      vi.mocked(git.getRemoteUrl).mockImplementation(() => {
        throw new ConfigError(ERROR_NO_REMOTE_URL);
      });

      const result = authService.detect();

      expect(result).toEqual({
        success: true,
        repository: null,
        profile: DEFAULT_PROFILE_NAME,
      });

      expect(config.setRepoLocalProfile).toHaveBeenCalledWith(
        DEFAULT_PROFILE_NAME,
      );

      expect(logger.warn).toHaveBeenCalledWith(
        "No git remote found. Using default profile.",
      );
    });
  });
});
