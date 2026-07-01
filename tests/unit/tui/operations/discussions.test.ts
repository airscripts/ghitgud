import { describe, it, expect, vi, beforeEach } from "vitest";

import discussionService from "@/services/discussion";
import discussionOperations from "@/tui/operations/discussions";

vi.mock("@/services/discussion", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    create: vi.fn(),
    comment: vi.fn(),
    close: vi.fn(),
    categories: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui discussion operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs discussion.list", async () => {
    await discussionOperations[0].run({
      values: { category: "General", limit: 10 },
    });
    expect(discussionService.list).toHaveBeenCalledWith("owner/repo", {
      category: "General",
      limit: 10,
    });
  });

  it("runs discussion.view", async () => {
    await discussionOperations[1].run({ values: { number: 5 } });
    expect(discussionService.view).toHaveBeenCalledWith("owner/repo", 5);
  });

  it("runs discussion.create", async () => {
    await discussionOperations[2].run({
      values: { title: "Test", category: "General", body: "desc" },
    });
    expect(discussionService.create).toHaveBeenCalledWith("owner/repo", {
      title: "Test",
      category: "General",
      body: "desc",
    });
  });

  it("runs discussion.comment", async () => {
    await discussionOperations[3].run({
      values: { number: 5, body: "comment" },
    });
    expect(discussionService.comment).toHaveBeenCalledWith(
      "owner/repo",
      "5",
      "comment",
    );
  });

  it("runs discussion.close", async () => {
    await discussionOperations[4].run({ values: { number: 5 } });
    expect(discussionService.close).toHaveBeenCalledWith("owner/repo", "5");
  });

  it("runs discussion.categories", async () => {
    await discussionOperations[5].run({ values: {} });
    expect(discussionService.categories).toHaveBeenCalledWith("owner/repo");
  });
});
