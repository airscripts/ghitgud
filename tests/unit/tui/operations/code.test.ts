import { describe, it, expect, vi, beforeEach } from "vitest";

import codeService from "@/services/code";
import codeOperations from "@/tui/operations/code";

vi.mock("@/services/code", () => ({
  default: {
    search: vi.fn(),
    definitions: vi.fn(),
    references: vi.fn(),
    file: vi.fn(),
    blame: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui code operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs code.search", async () => {
    await codeOperations[0].run({
      values: { query: "TODO", language: "ts" },
    });
    expect(codeService.search).toHaveBeenCalledWith("TODO", {
      repo: "owner/repo",
      language: "ts",
    });
  });

  it("runs code.definitions", async () => {
    await codeOperations[1].run({ values: { symbol: "MyClass" } });
    expect(codeService.definitions).toHaveBeenCalledWith("MyClass", {
      repo: "owner/repo",
    });
  });

  it("runs code.references", async () => {
    await codeOperations[2].run({ values: { symbol: "MyClass" } });
    expect(codeService.references).toHaveBeenCalledWith("MyClass", {
      repo: "owner/repo",
    });
  });

  it("runs code.file", async () => {
    await codeOperations[3].run({
      values: { path: "src/index.ts", ref: "main" },
    });
    expect(codeService.file).toHaveBeenCalledWith("src/index.ts", {
      repo: "owner/repo",
      ref: "main",
    });
  });

  it("runs code.blame", async () => {
    await codeOperations[4].run({ values: { path: "src/index.ts" } });
    expect(codeService.blame).toHaveBeenCalledWith("src/index.ts", {
      repo: "owner/repo",
    });
  });
});
