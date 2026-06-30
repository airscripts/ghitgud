import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import extensionService from "@/services/extension";

vi.mock("@/core/io", () => ({
  default: {
    ensureDir: vi.fn(),
    readDir: vi.fn(() => []),
    isDirectory: vi.fn(() => false),
    fileExists: vi.fn(() => false),
    readJsonFile: vi.fn(() => ({
      command: "ghg-hello",
      name: "ghg-hello",
      description: "-",
      version: "0.1.0",
    })),
    writeJsonFile: vi.fn(),
    writeFile: vi.fn(),
    removeDir: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

import io from "@/core/io";
import { execSync } from "child_process";

describe("extension service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists extensions when none installed", () => {
    (io.readDir as Mock).mockReturnValue([]);
    const result = extensionService.list();
    expect(result.success).toBe(true);
  });

  it("creates an extension with ghg- prefix", () => {
    (io.isDirectory as Mock).mockReturnValue(false);
    const result = extensionService.create("ghg-test-ext");
    expect(result.success).toBe(true);
  });

  it("rejects extension name without ghg- prefix", () => {
    expect(() => extensionService.create("bad-name")).toThrow(
      "must start with",
    );
  });

  it("exec runs an installed extension", () => {
    (io.isDirectory as Mock).mockReturnValue(true);
    (io.fileExists as Mock).mockReturnValue(true);
    (io.readJsonFile as Mock).mockReturnValue({
      command: "ghg-hello",
      name: "ghg-hello",
      description: "-",
      version: "0.1.0",
    });
    (execSync as Mock).mockReturnValue("");

    const result = extensionService.exec("ghg-hello", ["--flag"]);
    expect(result.success).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining("--flag"),
      expect.objectContaining({ cwd: expect.any(String) }),
    );
  });

  it("exec throws if extension is not installed", () => {
    (io.isDirectory as Mock).mockReturnValue(false);
    expect(() => extensionService.exec("ghg-missing")).toThrow(
      "is not installed",
    );
  });

  it("exec throws if extension has no entry point", () => {
    (io.isDirectory as Mock).mockReturnValue(true);
    (io.fileExists as Mock).mockReturnValue(false);
    expect(() => extensionService.exec("ghg-empty")).toThrow(
      "has no entry point",
    );
  });
});
