import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/core/git", () => ({
  default: {
    pushTag: vi.fn(),
    fetchTags: vi.fn(),
    createAnnotatedTag: vi.fn(),
    tagExists: vi.fn(() => false),
    isInsideRepo: vi.fn(() => true),
    getLatestTag: vi.fn(() => "2.9.0"),
    getCommitsSinceTag: vi.fn(() => []),
    verifyTag: vi.fn(() => ({ signed: false })),
    getCommitSignatureForTag: vi.fn(() => ({ signed: false })),
  },
}));

vi.mock("@/api/releases", () => ({
  default: {
    create: vi.fn(),
    fetchByTag: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    warn: vi.fn(),
    info: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    log: vi.fn(),
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
    renderSection: vi.fn(),
    renderErrorBox: vi.fn(),
    renderSuccessBox: vi.fn(),
  },
}));

vi.mock("@/core/template", () => ({
  default: {
    render: vi.fn((template: string, vars: Record<string, string>) =>
      template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? ""),
    ),
  },
}));

vi.mock("@/core/io", () => ({
  default: {
    ensureDir: vi.fn(),
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn(),
    fileExists: vi.fn(() => true),
  },
}));

import git from "@/core/git";
import api from "@/api/releases";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import releaseService from "@/services/release";
import { ERROR_NO_REPO } from "@/core/constants";

describe("release service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(git.isInsideRepo).mockReturnValue(true);
    vi.mocked(git.getLatestTag).mockReturnValue("2.9.0");
    vi.mocked(git.getCommitsSinceTag).mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("changelog", () => {
    it("should generate empty changelog when no commits", async () => {
      const result = await releaseService.changelog({});

      expect(result.success).toBe(true);
      expect(result.from).toBe("2.9.0");
      expect(result.to).toBe("HEAD");

      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        "No conventional commits found in range.",
      );
    });

    it("should generate changelog with commits", async () => {
      vi.mocked(git.getCommitsSinceTag).mockReturnValue([
        { hash: "abc", subject: "feat: new feature", body: "" },
        { hash: "def", subject: "fix: bug fix", body: "" },
      ]);

      const result = await releaseService.changelog({ since: "2.9.0" });

      expect(result.success).toBe(true);
      expect(result.groups.Added).toContain("new feature");
      expect(result.groups.Fixed).toContain("bug fix");

      expect(vi.mocked(logger.success)).toHaveBeenCalledWith(
        expect.stringContaining("Generated changelog"),
      );
    });
  });

  describe("bump", () => {
    it("should read-only bump", async () => {
      vi.mocked(git.getCommitsSinceTag).mockReturnValue([
        { hash: "abc", subject: "feat: something", body: "" },
      ]);

      const result = await releaseService.bump({});

      expect(result.success).toBe(true);
      expect(result.current).toBe("2.9.0");
      expect(result.next).toBe("2.10.0");
      expect(result.level).toBe("minor");
      expect(git.createAnnotatedTag).not.toHaveBeenCalled();
    });

    it("should create and push tag when flags passed", async () => {
      vi.mocked(git.getCommitsSinceTag).mockReturnValue([
        { hash: "abc", subject: "fix: bug", body: "" },
      ]);

      const result = await releaseService.bump({ create: true, push: true });

      expect(result.success).toBe(true);
      expect(result.next).toBe("2.9.1");

      expect(git.createAnnotatedTag).toHaveBeenCalledWith(
        "2.9.1",
        "Release 2.9.1",
      );

      expect(git.pushTag).toHaveBeenCalledWith("2.9.1");
    });

    it("should use explicit level over auto-detect", async () => {
      const result = await releaseService.bump({ level: "major" });

      expect(result.next).toBe("3.0.0");
      expect(result.level).toBe("major");
    });

    it("should return current version when no bump-worthy commits", async () => {
      const result = await releaseService.bump({});

      expect(result.next).toBe("2.9.0");
      expect(vi.mocked(logger.info)).toHaveBeenCalledWith(
        "No bump-worthy commits found.",
      );
    });

    it("should throw when not in repo and --create", async () => {
      vi.mocked(git.isInsideRepo).mockReturnValue(false);

      await expect(releaseService.bump({ create: true })).rejects.toThrow(
        "Cannot create tag outside of a git repository",
      );

      await expect(releaseService.bump({ create: true })).rejects.toThrow(
        GhitgudError,
      );
    });

    it("should throw domain error when push is used without create", async () => {
      await expect(releaseService.bump({ push: true })).rejects.toThrow(
        GhitgudError,
      );
    });
  });

  describe("verify", () => {
    it("should verify unsigned tag", async () => {
      vi.mocked(git.tagExists).mockReturnValue(true);
      vi.mocked(git.verifyTag).mockReturnValue({ signed: false });

      vi.mocked(git.getCommitSignatureForTag).mockReturnValue({
        signed: false,
      });

      const result = await releaseService.verify("2.10.0", {});
      expect(result.success).toBe(true);
      expect(result.tag).toBe("2.10.0");
      expect(result.tagSignature.signed).toBe(false);
      expect(result.commitSignature.signed).toBe(false);
    });

    it("should verify signed tag", async () => {
      vi.mocked(git.tagExists).mockReturnValue(true);
      vi.mocked(git.verifyTag).mockReturnValue({
        signed: true,
        key: "Test Key",
      });

      vi.mocked(git.getCommitSignatureForTag).mockReturnValue({
        signed: true,
        key: "Test Key",
      });

      vi.mocked(api.fetchByTag).mockResolvedValue({
        id: 1,
        name: null,
        body: null,
        draft: false,
        html_url: "",
        tag_name: "2.10.0",

        assets: [
          {
            id: 1,
            size: 100,
            name: "asset.zip",
            content_type: "application/zip",
          },
        ],
      });

      const result = await releaseService.verify("2.10.0", {
        repo: "owner/repo",
      });

      expect(result.success).toBe(true);
      expect(result.tagSignature.signed).toBe(true);
      expect(result.commitSignature.signed).toBe(true);
      expect(result.assets.valid).toBe(true);
    });

    it("should throw when tag not found", async () => {
      vi.mocked(git.tagExists).mockReturnValue(false);

      await expect(releaseService.verify("2.10.0", {})).rejects.toThrow(
        "Tag 2.10.0 not found",
      );
    });
  });

  describe("notes", () => {
    it("should generate notes with default template", async () => {
      vi.mocked(git.getCommitsSinceTag).mockReturnValue([
        { hash: "abc", subject: "feat: new feature", body: "" },
      ]);

      const result = await releaseService.notes({ repo: "owner/repo" });
      expect(result.success).toBe(true);
      expect(result.body).toContain("### Added");
      expect(result.body).toContain("new feature");
    });
  });

  describe("draft", () => {
    it("should create draft release", async () => {
      vi.mocked(api.create).mockResolvedValue({
        id: 1,
        assets: [],
        body: null,
        draft: true,
        name: "2.9.1",
        tag_name: "2.9.1",
        html_url: "https://github.com/owner/repo/releases/tag/2.9.1",
      });

      const result = await releaseService.draft({
        level: "patch",
        repo: "owner/repo",
      });

      expect(result.success).toBe(true);
      expect(result.tag).toBe("2.9.1");

      expect(api.create).toHaveBeenCalledWith(
        "owner/repo",

        expect.objectContaining({
          draft: true,
          tag_name: "2.9.1",
          generate_release_notes: true,
        }),
      );
    });

    it("should throw when repo not provided", async () => {
      await expect(
        releaseService.draft({
          level: "patch",
          repo: undefined as unknown as string,
        }),
      ).rejects.toThrow(ERROR_NO_REPO);
    });
  });
});
