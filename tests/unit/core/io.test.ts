import os from "os";
import fs from "fs";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import io from "@/core/io";
import { ENCODING } from "@/core/constants";
import { GhitgudError } from "@/core/errors";

describe("io", () => {
  const testDir = path.join(os.tmpdir(), "ghitgud-test-io");
  const testFile = path.join(testDir, "test.json");

  beforeEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
  });

  describe("readJsonFile", () => {
    it("should read and parse a JSON file", () => {
      fs.writeFileSync(testFile, JSON.stringify({ name: "test" }), ENCODING);
      const result = io.readJsonFile<{ name: string }>(testFile);
      expect(result).toEqual({ name: "test" });
    });

    it("should read an array from a JSON file", () => {
      const data = [{ name: "bug", color: "fff" }];
      fs.writeFileSync(testFile, JSON.stringify(data), ENCODING);
      const result = io.readJsonFile<Array<{ name: string }>>(testFile);
      expect(result).toEqual(data);
    });
  });

  describe("writeJsonFile", () => {
    it("should write data as formatted JSON", () => {
      io.writeJsonFile(testFile, { name: "test" });
      const content = fs.readFileSync(testFile, ENCODING);
      expect(JSON.parse(content)).toEqual({ name: "test" });
    });

    it("should format JSON with 2-space indentation", () => {
      io.writeJsonFile(testFile, { a: 1 });
      const content = fs.readFileSync(testFile, ENCODING);
      expect(content).toBe('{\n  "a": 1\n}');
    });
  });

  describe("fileExists", () => {
    it("should return true for existing file", () => {
      fs.writeFileSync(testFile, "{}", ENCODING);
      expect(io.fileExists(testFile)).toBe(true);
    });

    it("should return false for non-existent file", () => {
      expect(io.fileExists("/nonexistent/path.json")).toBe(false);
    });
  });

  describe("ensureDir", () => {
    it("should create directory if it does not exist", () => {
      const newDir = path.join(testDir, "subdir");
      io.ensureDir(newDir);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it("should not throw if directory already exists", () => {
      io.ensureDir(testDir);
      expect(fs.existsSync(testDir)).toBe(true);
    });
  });

  describe("resolveInsideRoot", () => {
    it("resolves relative paths inside the root", () => {
      expect(io.resolveInsideRoot("/repo", "src/main.ts")).toBe(
        "/repo/src/main.ts",
      );
    });

    it("rejects absolute paths", () => {
      expect(() => io.resolveInsideRoot("/repo", "/tmp/outside.ts")).toThrow(
        GhitgudError,
      );
    });

    it("rejects paths escaping the root", () => {
      expect(() => io.resolveInsideRoot("/repo", "../outside.ts")).toThrow(
        "Path escapes repository root: ../outside.ts",
      );
    });
  });

  describe("safeFilename", () => {
    it("keeps readable safe filename characters", () => {
      expect(io.safeFilename("logs.v1-cache_key", "fallback")).toBe(
        "logs.v1-cache_key",
      );
    });

    it("replaces unsafe filename characters", () => {
      expect(io.safeFilename("../artifact name?.zip", "fallback")).toBe(
        ".._artifact_name_.zip",
      );
    });

    it("uses fallback when sanitized value is empty", () => {
      expect(io.safeFilename("///", "fallback")).toBe("fallback");
    });
  });
});
