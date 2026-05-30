import { describe, it, expect, vi, beforeEach } from "vitest";

import api from "@/api/review";
import git from "@/core/git";
import service from "@/services/review";

vi.mock("@/api/review", () => ({
  default: {
    listComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
    listFiles: vi.fn(),
    getPrDetails: vi.fn(),
  },
}));

vi.mock("@/core/git", () => ({
  default: {
    getCurrentBranch: vi.fn(),
    checkoutBranch: vi.fn(),
    branchExistsLocally: vi.fn(),
    fetchBranch: vi.fn(),
    stageFiles: vi.fn(),
    commitChanges: vi.fn(),
    pushToRemote: vi.fn(),
    isInsideRepo: vi.fn(),
    getRepoRoot: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    getRepoOptional: vi.fn(() => "owner/repo"),
  },
}));

describe("review service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a comment", async () => {
    vi.mocked(api.listFiles).mockResolvedValue(
      new Response(
        JSON.stringify([{ filename: "src/main.ts", sha: "abc123" }]),
      ),
    );
    vi.mocked(api.createComment).mockResolvedValue(
      new Response(JSON.stringify({ id: 1 })),
    );

    const result = await service.comment({
      pr: 42,
      file: "src/main.ts",
      line: 10,
      body: "LGTM",
    });

    expect(result.success).toBe(true);
    expect(result.commentId).toBe(1);
  });

  it("lists threads", async () => {
    const comments = [
      {
        id: 1,
        body: "first",
        path: "src/main.ts",
        line: 5,
        side: "RIGHT",
        user: { login: "alice" },
        createdAt: "2026-05-30",
      },
      {
        id: 2,
        body: "reply",
        path: "src/main.ts",
        line: 5,
        side: "RIGHT",
        inReplyToId: 1,
        user: { login: "bob" },
        createdAt: "2026-05-30",
      },
    ];

    vi.mocked(api.listComments).mockResolvedValue(
      new Response(JSON.stringify(comments)),
    );

    const result = await service.threads(42);

    expect(result.success).toBe(true);
    expect(result.metadata).toHaveLength(1);
    expect(result.metadata[0].comments).toHaveLength(2);
  });

  it("resolves a thread", async () => {
    const comments = [
      {
        id: 1,
        body: "issue here",
        path: "src/main.ts",
        line: 5,
        side: "RIGHT",
        user: { login: "alice" },
        createdAt: "2026-05-30",
      },
    ];

    vi.mocked(api.listComments).mockResolvedValue(
      new Response(JSON.stringify(comments)),
    );
    vi.mocked(api.updateComment).mockResolvedValue(
      new Response(JSON.stringify({ id: 1 })),
    );

    const result = await service.resolve(1, "owner/repo", 42);

    expect(result.success).toBe(true);
    expect(result.threadId).toBe(1);
  });

  it("creates a suggestion", async () => {
    vi.mocked(api.listFiles).mockResolvedValue(
      new Response(
        JSON.stringify([{ filename: "src/main.ts", sha: "abc123" }]),
      ),
    );
    vi.mocked(api.createComment).mockResolvedValue(
      new Response(JSON.stringify({ id: 1 })),
    );

    const result = await service.suggest({
      pr: 42,
      file: "src/main.ts",
      line: 10,
      replace: "const x = 1;",
    });

    expect(result.success).toBe(true);
    expect(result.commentId).toBe(1);
  });

  it("applies suggestions", async () => {
    const comments = [
      {
        id: 1,
        body: "```suggestion\nconst x = 2;\n```",
        path: "src/main.ts",
        line: 10,
        side: "RIGHT",
        user: { login: "alice" },
        createdAt: "2026-05-30",
      },
    ];

    vi.mocked(api.listComments).mockResolvedValue(
      new Response(JSON.stringify(comments)),
    );
    vi.mocked(api.getPrDetails).mockResolvedValue(
      new Response(JSON.stringify({ head: { ref: "feature" } })),
    );

    vi.mocked(git.getCurrentBranch).mockReturnValue("main");
    vi.mocked(git.branchExistsLocally).mockReturnValue(false);
    vi.mocked(git.isInsideRepo).mockReturnValue(true);
    vi.mocked(git.getRepoRoot).mockReturnValue("/tmp/repo");

    const result = await service.apply(42, "owner/repo", false);

    expect(result.success).toBe(true);
    expect(result.metadata.branch).toBe("feature");
  });
});
