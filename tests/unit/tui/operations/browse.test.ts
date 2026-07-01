import { describe, it, expect, vi, beforeEach } from "vitest";

import browseService from "@/services/browse";
import browseOperations from "@/tui/operations/browse";

vi.mock("@/services/browse", () => ({
  default: {
    browseRepo: vi.fn(),
    browseIssues: vi.fn(),
    browsePulls: vi.fn(),
    browseActions: vi.fn(),
    browseReleases: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui browse operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs browse.repo", async () => {
    await browseOperations[0].run({ values: { path: "src/main.ts" } });
    expect(browseService.browseRepo).toHaveBeenCalledWith({
      repo: "owner/repo",
      path: "src/main.ts",
      line: undefined,
    });
  });

  it("runs browse.issues", async () => {
    await browseOperations[1].run({ values: {} });
    expect(browseService.browseIssues).toHaveBeenCalledWith({
      repo: "owner/repo",
    });
  });

  it("runs browse.pulls", async () => {
    await browseOperations[2].run({ values: {} });
    expect(browseService.browsePulls).toHaveBeenCalledWith({
      repo: "owner/repo",
    });
  });

  it("runs browse.actions", async () => {
    await browseOperations[3].run({ values: {} });
    expect(browseService.browseActions).toHaveBeenCalledWith({
      repo: "owner/repo",
    });
  });

  it("runs browse.releases", async () => {
    await browseOperations[4].run({ values: {} });
    expect(browseService.browseReleases).toHaveBeenCalledWith({
      repo: "owner/repo",
    });
  });
});
