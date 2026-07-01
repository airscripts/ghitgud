import { describe, it, expect, vi, beforeEach } from "vitest";

import codespaceService from "@/services/codespace";
import codespaceOperations from "@/tui/operations/dev";

vi.mock("@/services/codespace", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    create: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui codespace operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs codespace.list", async () => {
    await codespaceOperations[0].run({ values: {} });
    expect(codespaceService.list).toHaveBeenCalled();
  });

  it("runs codespace.view", async () => {
    await codespaceOperations[1].run({ values: { id: "cs-123" } });
    expect(codespaceService.view).toHaveBeenCalledWith("cs-123");
  });

  it("runs codespace.create", async () => {
    await codespaceOperations[2].run({
      values: { ref: "main", machine: "standardLinux", idleTimeout: 30 },
    });
    expect(codespaceService.create).toHaveBeenCalledWith({
      repo: "owner/repo",
      ref: "main",
      machine: "standardLinux",
      idleTimeout: 30,
    });
  });

  it("runs codespace.start", async () => {
    await codespaceOperations[3].run({ values: { id: "cs-123" } });
    expect(codespaceService.start).toHaveBeenCalledWith("cs-123");
  });

  it("runs codespace.stop", async () => {
    await codespaceOperations[4].run({ values: { id: "cs-123" } });
    expect(codespaceService.stop).toHaveBeenCalledWith("cs-123");
  });

  it("runs codespace.delete", async () => {
    await codespaceOperations[5].run({ values: { id: "cs-123" } });
    expect(codespaceService.delete).toHaveBeenCalledWith("cs-123", {
      yes: true,
    });
  });
});
