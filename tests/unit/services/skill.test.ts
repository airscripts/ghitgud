import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/skill", () => ({
  default: {
    search: vi.fn(),
    getSkill: vi.fn(),
    publish: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSection: vi.fn(),
    renderKeyValues: vi.fn(),
    writeResult: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/core/spinner", () => ({
  default: {
    withSpinner: vi.fn((_msg, fn) => fn()),
  },
}));

vi.mock("@/core/io", () => ({
  default: {
    ensureDir: vi.fn(),
    fileExists: vi.fn(() => false),
    isDirectory: vi.fn(() => false),
    readDir: vi.fn(() => []),
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn(),
  },
}));

vi.mock("@/core/constants", () => ({
  SKILLS_DIR: "/tmp/ghg-test-skills",
  GHITGUD_FOLDER: "/tmp/ghg-test",
}));

import skillService from "@/services/skill";
import api from "@/api/skill";
import io from "@/core/io";
import { GhitgudError } from "@/core/errors";

describe("skill service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return empty list when no skills installed", () => {
      const result = skillService.list();
      expect(result.success).toBe(true);
      expect(result.skills).toEqual([]);
    });

    it("should list installed skills with manifests", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.isDirectory as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readDir as ReturnType<typeof vi.fn>).mockReturnValue(["test-skill"]);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        name: "test-skill",
        version: "1.0.0",
        description: "A test skill",
        repository: "owner/test-skill",
      });

      const result = skillService.list();
      expect(result.success).toBe(true);
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe("test-skill");
    });

    it("should handle corrupt manifest files gracefully", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.isDirectory as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readDir as ReturnType<typeof vi.fn>).mockReturnValue([
        "broken-skill",
      ]);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Invalid JSON");
      });

      const result = skillService.list();
      expect(result.success).toBe(true);
      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].name).toBe("broken-skill");
      expect(result.skills[0].version).toBe("unknown");
    });

    it("should skip directories without manifest", () => {
      (io.isDirectory as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readDir as ReturnType<typeof vi.fn>).mockReturnValue(["no-manifest"]);
      (io.fileExists as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = skillService.list();
      expect(result.success).toBe(true);
      expect(result.skills).toEqual([]);
    });
  });

  describe("search", () => {
    it("should search skills with query", async () => {
      (api.search as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => [
          {
            name: "test-skill",
            description: "A test skill",
            repository: "owner/test-skill",
            url: "https://github.com/owner/test-skill",
          },
        ],
      });

      const result = await skillService.search("test");
      expect(result.success).toBe(true);
    });

    it("should list installed skills when no query", async () => {
      const result = await skillService.search();
      expect(result.success).toBe(true);
    });

    it("should return empty results when no matches found", async () => {
      (api.search as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => [],
      });

      const result = await skillService.search("nonexistent");
      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
    });

    it("should handle search results with alternative field names", async () => {
      (api.search as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => [
          {
            name: "test-skill",
            description: "A test skill",
            full_name: "owner/test-skill",
            html_url: "https://github.com/owner/test-skill",
          },
        ],
      });

      const result = await skillService.search("test");
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
    });
  });

  describe("install", () => {
    it("should install a skill from a repository", async () => {
      (api.getSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          manifest: {
            name: "test-skill",
            version: "1.0.0",
            description: "A test skill",
            command: "test-skill",
          },
        }),
      });

      const result = await skillService.install("owner/test-skill");
      expect(result.success).toBe(true);
      expect(result.skill.name).toBe("test-skill");
      expect(io.writeJsonFile).toHaveBeenCalled();
    });

    it("should install a specific skill by name", async () => {
      (api.getSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          manifest: {
            name: "my-skill",
            version: "2.0.0",
            description: "My skill",
            command: "my-skill",
          },
        }),
      });

      const result = await skillService.install("owner/repo", "my-skill");
      expect(result.success).toBe(true);
      expect(result.skill.name).toBe("my-skill");
    });

    it("should use skill name from repository when manifest has no name", async () => {
      (api.getSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          version: "1.0.0",
          description: "No name skill",
        }),
      });

      const result = await skillService.install("owner/no-name-skill");
      expect(result.success).toBe(true);
      expect(result.skill.name).toBe("no-name-skill");
    });
  });

  describe("preview", () => {
    it("should preview a skill before installation", async () => {
      (api.getSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          manifest: {
            name: "preview-skill",
            version: "1.0.0",
            description: "Preview me",
            command: "preview-skill",
          },
        }),
      });

      const result = await skillService.preview("owner/repo");
      expect(result.success).toBe(true);
      expect(result.preview.name).toBe("preview-skill");
    });

    it("should handle preview without manifest wrapper", async () => {
      (api.getSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          name: "direct-skill",
          version: "1.0.0",
          description: "Direct skill",
          command: "direct-skill",
        }),
      });

      const result = await skillService.preview("owner/repo");
      expect(result.success).toBe(true);
      expect(result.preview.name).toBe("direct-skill");
    });
  });

  describe("publish", () => {
    it("should publish a skill with manifest file path", async () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        name: "test-skill",
        version: "1.0.0",
        command: "test-skill",
      });
      (api.publish as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({ id: "123" }),
      });

      const result = await skillService.publish(
        "owner/repo",
        "/path/to/skill.json",
      );
      expect(result.success).toBe(true);
      expect(io.readJsonFile).toHaveBeenCalledWith("/path/to/skill.json");
    });

    it("should throw when no skill.json found in current directory", async () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(false);

      await expect(
        skillService.publish("owner/repo", undefined),
      ).rejects.toThrow(GhitgudError);
    });
  });

  describe("update", () => {
    it("should return empty when no skills installed and no name given", async () => {
      const result = await skillService.update();
      expect(result.success).toBe(true);
      expect(result.updated).toEqual([]);
    });

    it("should throw when updating a non-existent skill", async () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.isDirectory as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readDir as ReturnType<typeof vi.fn>).mockReturnValue(["my-skill"]);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        name: "my-skill",
        version: "1.0.0",
        description: "",
        repository: "owner/repo",
        installed: true,
        path: "/tmp/ghg-test-skills/my-skill",
      });

      await expect(skillService.update("nonexistent")).rejects.toThrow(
        "not installed",
      );
    });

    it("should update an installed skill", async () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.isDirectory as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readDir as ReturnType<typeof vi.fn>).mockReturnValue(["my-skill"]);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        name: "my-skill",
        version: "1.0.0",
        description: "",
        repository: "owner/repo",
      });
      (api.getSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          manifest: {
            name: "my-skill",
            version: "2.0.0",
            description: "Updated",
            command: "my-skill",
          },
        }),
      });

      const result = await skillService.update("my-skill");
      expect(result.success).toBe(true);
      expect(result.updated).toContain("my-skill");
    });

    it("should warn on failed skill update", async () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.isDirectory as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readDir as ReturnType<typeof vi.fn>).mockReturnValue(["my-skill"]);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        name: "my-skill",
        version: "1.0.0",
        description: "",
        repository: "owner/repo",
      });
      (api.getSkill as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("network error"),
      );

      const result = await skillService.update("my-skill");
      expect(result.success).toBe(true);
      expect(result.updated).toEqual([]);
    });

    it("should update all skills when no name specified", async () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.isDirectory as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readDir as ReturnType<typeof vi.fn>).mockReturnValue([
        "skill-a",
        "skill-b",
      ]);
      (io.readJsonFile as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({
          name: "skill-a",
          version: "1.0.0",
          description: "",
          repository: "owner/skill-a",
        })
        .mockReturnValueOnce({
          name: "skill-b",
          version: "1.0.0",
          description: "",
          repository: "owner/skill-b",
        });
      (api.getSkill as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          manifest: { name: "updated", version: "2.0.0" },
        }),
      });

      const result = await skillService.update();
      expect(result.success).toBe(true);
    });
  });
});
