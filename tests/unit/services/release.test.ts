import fs from "fs";
import os from "os";
import path from "path";

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
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteAsset: vi.fn(),
    downloadAsset: vi.fn(),
    uploadAsset: vi.fn(),
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
  const release = {
    id: 1,
    assets: [],
    body: "notes",
    draft: false,
    prerelease: false,
    name: "Release",
    tag_name: "v1.0.0",
    html_url: "https://example.test/release",
    upload_url: "https://uploads.example.test/{?name}",
    created_at: "2026-01-01T00:00:00Z",
    published_at: "2026-01-01T00:00:00Z",
  };

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

    it("uses fallbacks outside a git repository", async () => {
      vi.mocked(git.isInsideRepo).mockReturnValue(false);
      const result = await releaseService.changelog({});
      expect(result.body).toBe("");
    });
  });

  describe("lifecycle", () => {
    it("lists and views releases", async () => {
      vi.mocked(api.list).mockResolvedValue([release]);
      vi.mocked(api.fetchByTag).mockResolvedValue(release);

      expect(
        (await releaseService.list({ repo: "owner/repo" })).releases,
      ).toHaveLength(1);
      expect(
        (await releaseService.view("v1.0.0", "owner/repo")).release,
      ).toEqual(release);

      vi.mocked(api.list).mockResolvedValue([
        {
          ...release,
          name: null,
          body: null,
          draft: true,
          prerelease: true,
          published_at: null,
        },
      ]);
      vi.mocked(api.fetchByTag).mockResolvedValue({
        ...release,
        name: null,
        body: null,
      });
      await releaseService.list({ repo: "owner/repo", limit: 1 });
      await releaseService.view("v1.0.0", "owner/repo");
    });

    it("creates, edits, and deletes releases", async () => {
      vi.mocked(api.create).mockResolvedValue(release);
      vi.mocked(api.fetchByTag).mockResolvedValue(release);
      vi.mocked(api.update).mockResolvedValue({ ...release, name: "Updated" });

      await releaseService.create("v1.0.0", {
        repo: "owner/repo",
        title: "Release",
        draft: true,
        prerelease: true,
        latest: true,
      });
      await releaseService.create("v1.0.0", { repo: "owner/repo" });
      await releaseService.edit("v1.0.0", {
        repo: "owner/repo",
        title: "Updated",
      });
      await releaseService.remove("v1.0.0", "owner/repo");

      expect(api.update).toHaveBeenCalledWith("owner/repo", 1, {
        name: "Updated",
        body: undefined,
      });
      expect(api.delete).toHaveBeenCalledWith("owner/repo", 1);
    });

    it("rejects empty edits and missing assets", async () => {
      await expect(
        releaseService.edit("v1.0.0", { repo: "owner/repo" }),
      ).rejects.toThrow("Provide --title or --notes");

      vi.mocked(api.fetchByTag).mockResolvedValue(release);
      await expect(
        releaseService.deleteAsset("v1.0.0", "missing.zip", "owner/repo"),
      ).rejects.toThrow("Asset missing.zip not found");
    });

    it("downloads an empty matching asset set", async () => {
      vi.mocked(api.fetchByTag).mockResolvedValue(release);
      const result = await releaseService.download("v1.0.0", {
        repo: "owner/repo",
        pattern: "*.zip",
      });
      expect(result.files).toEqual([]);
      const defaultResult = await releaseService.download("v1.0.0", {
        repo: "owner/repo",
      });
      expect(defaultResult.files).toEqual([]);
    });

    it("downloads, uploads, replaces, and deletes assets", async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ghg-release-"));
      const uploadFile = path.join(dir, "upload.zip");
      fs.writeFileSync(uploadFile, "upload");
      const assetRelease = {
        ...release,
        assets: [
          {
            id: 2,
            size: 4,
            name: "asset.zip",
            content_type: "application/zip",
            browser_download_url: "https://example.test/asset.zip",
          },
          {
            id: 3,
            size: 6,
            name: "upload.zip",
            content_type: "application/zip",
            browser_download_url: "https://example.test/upload.zip",
          },
        ],
      };
      vi.mocked(api.fetchByTag).mockResolvedValue(assetRelease);
      vi.mocked(api.downloadAsset).mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3, 4])),
      );
      vi.mocked(api.uploadAsset).mockResolvedValue({ id: 4 });

      const downloaded = await releaseService.download("v1.0.0", {
        repo: "owner/repo",
        pattern: "asset.?ip",
        outputDir: dir,
      });
      expect(downloaded.files).toHaveLength(1);
      await expect(
        releaseService.download("v1.0.0", {
          repo: "owner/repo",
          pattern: "asset.zip",
          outputDir: dir,
        }),
      ).rejects.toThrow("File already exists");

      await expect(
        releaseService.upload("v1.0.0", [uploadFile], {
          repo: "owner/repo",
        }),
      ).rejects.toThrow("Use --clobber");

      const uploaded = await releaseService.upload("v1.0.0", [uploadFile], {
        repo: "owner/repo",
        clobber: true,
      });
      expect(uploaded.assets).toHaveLength(1);
      expect(api.deleteAsset).toHaveBeenCalledWith("owner/repo", 3);

      await releaseService.deleteAsset("v1.0.0", "asset.zip", "owner/repo");
      expect(api.deleteAsset).toHaveBeenCalledWith("owner/repo", 2);

      fs.rmSync(dir, { recursive: true, force: true });
    });

    it("rejects missing upload files and existing downloads", async () => {
      vi.mocked(api.fetchByTag).mockResolvedValue({
        ...release,
        assets: [
          {
            id: 2,
            size: 4,
            name: "asset.zip",
            content_type: "application/zip",
            browser_download_url: "https://example.test/asset.zip",
          },
        ],
      });

      await expect(
        releaseService.upload("v1.0.0", ["missing.zip"], {
          repo: "owner/repo",
        }),
      ).rejects.toThrow("File not found");

      await expect(
        releaseService.download("v1.0.0", {
          repo: "owner/repo",
          outputDir: process.cwd(),
          pattern: "package.json",
        }),
      ).resolves.toMatchObject({ files: [] });
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

    it("falls back for a non-semver latest tag", async () => {
      vi.mocked(git.getLatestTag).mockReturnValue("latest");
      const result = await releaseService.bump({ level: "patch" });
      expect(result.next).toBe("0.0.1");
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
        prerelease: false,
        created_at: "2026-06-30T00:00:00Z",
        published_at: "2026-06-30T00:00:00Z",
        upload_url: "https://uploads.github.com/releases/1/assets{?name,label}",

        assets: [
          {
            id: 1,
            size: 100,
            name: "asset.zip",
            content_type: "application/zip",
            browser_download_url: "https://example.test/asset.zip",
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

    it("writes notes and falls back when templates are unavailable", async () => {
      const target = path.join(os.tmpdir(), "ghg-release-notes.md");
      const io = (await import("@/core/io")).default;
      vi.mocked(io.fileExists).mockReturnValue(false);
      const result = await releaseService.notes({
        repo: "owner/repo",
        templateFile: "missing.md",
        out: target,
      });
      expect(result.success).toBe(true);
      fs.rmSync(target, { force: true });
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
        prerelease: false,
        created_at: "2026-06-30T00:00:00Z",
        published_at: null,
        upload_url: "https://uploads.github.com/releases/1/assets{?name,label}",
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

      await releaseService.draft({
        repo: "owner/repo",
        level: "minor",
        title: "Custom",
        notes: "Custom notes",
      });
      expect(api.create).toHaveBeenLastCalledWith(
        "owner/repo",
        expect.objectContaining({
          body: "Custom notes",
          generate_release_notes: false,
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
