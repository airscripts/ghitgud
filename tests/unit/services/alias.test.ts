import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/core/config", () => ({
  default: {
    read: vi.fn(),
    write: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
    writeResult: vi.fn(),
    writeError: vi.fn(),
  },
}));

vi.mock("@/core/io", () => ({
  default: {
    fileExists: vi.fn(),
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn(),
    ensureDir: vi.fn(),
    readDir: vi.fn(),
    isDirectory: vi.fn(),
  },
}));

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

import fs from "fs";
import aliasService from "@/services/alias";
import io from "@/core/io";
import { GhitgudError } from "@/core/errors";

describe("alias service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({});
  });

  describe("set", () => {
    it("should create a new alias", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({});

      const result = aliasService.set("co", "checkout");

      expect(result.success).toBe(true);
      expect(result.name).toBe("co");
      expect(result.expansion).toBe("checkout");
      expect(io.writeJsonFile).toHaveBeenCalled();
    });

    it("should throw if name is empty", () => {
      expect(() => aliasService.set("", "checkout")).toThrow(GhitgudError);
    });

    it("should throw if expansion is empty", () => {
      expect(() => aliasService.set("co", "")).toThrow(GhitgudError);
    });

    it("should throw if alias already exists without force", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        co: "checkout",
      });

      expect(() => aliasService.set("co", "checkout")).toThrow(GhitgudError);
    });

    it("should overwrite alias with force flag", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        co: "checkout",
      });

      const result = aliasService.set("co", "checkout --branch", true);

      expect(result.success).toBe(true);
      expect(io.writeJsonFile).toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("should return empty list when no aliases exist", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = aliasService.list();

      expect(result.success).toBe(true);
      expect(result.aliases).toEqual([]);
    });

    it("should list all aliases", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        co: "checkout",
        br: "branch",
      });

      const result = aliasService.list();

      expect(result.success).toBe(true);
      expect(result.aliases).toHaveLength(2);
    });
  });

  describe("deleteAlias", () => {
    it("should delete an existing alias", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        co: "checkout",
      });

      const result = aliasService.deleteAlias("co");

      expect(result.success).toBe(true);
      expect(io.writeJsonFile).toHaveBeenCalled();
    });

    it("should throw if alias not found", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({});

      expect(() => aliasService.deleteAlias("co")).toThrow(GhitgudError);
    });

    it("should throw if name is empty", () => {
      expect(() => aliasService.deleteAlias("")).toThrow(GhitgudError);
    });
  });

  describe("importAliases", () => {
    it("should import aliases from a file", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({});
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        "co=checkout\nbr=branch",
      );

      const result = aliasService.importAliases("/path/to/file");

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(io.writeJsonFile).toHaveBeenCalled();
    });

    it("should skip comment lines", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({});
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        "# comment\nco=checkout",
      );

      const result = aliasService.importAliases("/path/to/file");

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });

    it("should skip lines without separator", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({});
      (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
        "invalidline\nco=checkout",
      );

      const result = aliasService.importAliases("/path/to/file");

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
    });
  });

  describe("resolve", () => {
    it("should return null when no aliases exist", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const result = aliasService.resolve(["co"]);

      expect(result).toBeNull();
    });

    it("should resolve an alias", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        co: "checkout",
      });

      const result = aliasService.resolve(["co", "main"]);

      expect(result).toEqual(["checkout", "main"]);
    });

    it("should return null for unknown commands", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        co: "checkout",
      });

      const result = aliasService.resolve(["push"]);

      expect(result).toBeNull();
    });

    it("should return null for empty args", () => {
      const result = aliasService.resolve([]);

      expect(result).toBeNull();
    });

    it("should resolve multi-word expansions", () => {
      (io.fileExists as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (io.readJsonFile as ReturnType<typeof vi.fn>).mockReturnValue({
        mpr: "merge pr",
      });

      const result = aliasService.resolve(["mpr", "42"]);

      expect(result).toEqual(["merge", "pr", "42"]);
    });
  });
});
