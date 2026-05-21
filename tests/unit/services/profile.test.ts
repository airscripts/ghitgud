import git from "@/core/git";
import client from "@/api/client";
import config from "@/core/config";
import logger from "@/core/logger";
import { ConfigError } from "@/core/errors";
import profileService from "@/services/profile";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  DEFAULT_PROFILE_NAME,
  ERROR_PROFILE_NOT_FOUND,
  ERROR_PROFILE_TOKEN_REQUIRED,
} from "@/core/constants";

vi.mock("@/api/client", () => ({
  default: {
    validateToken: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    addProfile: vi.fn(),
    getProfile: vi.fn(),
    listProfiles: vi.fn(),
    setActiveProfile: vi.fn(),
    findProfileByRepo: vi.fn(),
    setRepoLocalProfile: vi.fn(),
  },
}));

vi.mock("@/core/git", () => ({
  default: {
    getRemoteUrl: vi.fn(),
    parseRepoFromRemoteUrl: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
  },
}));

describe("profile service", () => {
  beforeEach(() => {
    vi.spyOn(logger, "success").mockImplementation(() => {});
    vi.spyOn(logger, "info").mockImplementation(() => {});
    vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a profile", () => {
    const result = profileService.add("work", {
      token: "token",
      repo: "owner/repo",
    });

    expect(result).toEqual({ success: true, profile: "work" });
    expect(config.addProfile).toHaveBeenCalledWith("work", {
      token: "token",
      repo: "owner/repo",
    });

    expect(logger.success).toHaveBeenCalledWith(
      'Profile "work" added successfully.',
    );
  });

  it("lists configured profiles", () => {
    (config.listProfiles as ReturnType<typeof vi.fn>).mockReturnValue([
      {
        active: true,
        hasToken: true,
        name: "default",
        repo: "owner/repo",
      },
    ]);

    const result = profileService.list();

    expect(result).toEqual({
      success: true,
      profiles: [
        {
          active: true,
          hasToken: true,
          name: "default",
          repo: "owner/repo",
        },
      ],
    });

    expect(logger.info).toHaveBeenCalledWith("* default - owner/repo - token");
  });

  it("switches the active profile after validation", async () => {
    (config.getProfile as ReturnType<typeof vi.fn>).mockReturnValue({
      repo: "owner/repo",
      token: "token",
    });

    (client.validateToken as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
    });

    const result = await profileService.switch("work");

    expect(result).toEqual({ success: true, profile: "work" });
    expect(client.validateToken).toHaveBeenCalledWith("token");
    expect(config.setActiveProfile).toHaveBeenCalledWith("work");

    expect(logger.success).toHaveBeenCalledWith(
      'Active profile switched to "work".',
    );
  });

  it("throws when switching to a missing profile", async () => {
    (config.getProfile as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await expect(profileService.switch("missing")).rejects.toThrow(ConfigError);

    await expect(profileService.switch("missing")).rejects.toThrow(
      ERROR_PROFILE_NOT_FOUND,
    );

    expect(config.setActiveProfile).not.toHaveBeenCalled();
  });

  it("throws when adding a profile without a token", () => {
    expect(() => profileService.add("work", {})).toThrow(ConfigError);

    expect(() => profileService.add("work", {})).toThrow(
      ERROR_PROFILE_TOKEN_REQUIRED,
    );
  });

  it("detects a matching profile for the current repository", () => {
    (git.getRemoteUrl as ReturnType<typeof vi.fn>).mockReturnValue(
      "https://github.com/owner/repo.git",
    );

    (git.parseRepoFromRemoteUrl as ReturnType<typeof vi.fn>).mockReturnValue(
      "owner/repo",
    );

    (config.findProfileByRepo as ReturnType<typeof vi.fn>).mockReturnValue(
      "work",
    );

    const result = profileService.detect();

    expect(result).toEqual({
      success: true,
      profile: "work",
      fallback: false,
      repository: "owner/repo",
    });

    expect(config.setRepoLocalProfile).toHaveBeenCalledWith("work");
    expect(logger.success).toHaveBeenCalledWith(
      'Detected profile "work" for owner/repo.',
    );
  });

  it("falls back to default when no profile matches", () => {
    (git.getRemoteUrl as ReturnType<typeof vi.fn>).mockReturnValue(
      "https://github.com/owner/repo.git",
    );

    (git.parseRepoFromRemoteUrl as ReturnType<typeof vi.fn>).mockReturnValue(
      "owner/repo",
    );

    (config.findProfileByRepo as ReturnType<typeof vi.fn>).mockReturnValue(
      null,
    );

    const result = profileService.detect();

    expect(result).toEqual({
      success: true,
      profile: DEFAULT_PROFILE_NAME,
      repository: "owner/repo",
      fallback: true,
    });

    expect(config.setRepoLocalProfile).toHaveBeenCalledWith(
      DEFAULT_PROFILE_NAME,
    );

    expect(logger.warn).toHaveBeenCalledWith(
      `No matching profile found for owner/repo. Falling back to "${DEFAULT_PROFILE_NAME}".`,
    );
  });
});
