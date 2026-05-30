import git from "@/core/git";
import api from "@/api/review";
import service from "@/services/review";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/review", () => ({
  default: {
    listFiles: vi.fn(),
    getPrDetails: vi.fn(),
    listComments: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
  },
}));

vi.mock("@/core/git", () => ({
  default: {
    stageFiles: vi.fn(),
    getRepoRoot: vi.fn(),
    fetchBranch: vi.fn(),
    pushToRemote: vi.fn(),
    isInsideRepo: vi.fn(),
    commitChanges: vi.fn(),
    checkoutBranch: vi.fn(),
    getCurrentBranch: vi.fn(),
    branchExistsLocally: vi.fn(),
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
    vi.mocked(api.getPrDetails).mockResolvedValue(
      new Response(JSON.stringify({ head: { sha: "head123" } })),
    );

    vi.mocked(api.createComment).mockResolvedValue(
      new Response(JSON.stringify({ id: 1 })),
    );

    const result = await service.comment({
      pr: 42,
      line: 10,
      body: "LGTM",
      file: "src/main.ts",
    });

    expect(result.success).toBe(true);
    expect(result.commentId).toBe(1);

    expect(api.createComment).toHaveBeenCalledWith("owner/repo", 42, {
      line: 10,
      body: "LGTM",
      side: "RIGHT",
      path: "src/main.ts",
      commit_id: "head123",
    });
  });

  it("lists threads", async () => {
    const comments = [
      {
        id: 1,
        line: 5,
        side: "RIGHT",
        body: "first",
        path: "src/main.ts",
        createdAt: "2026-05-30",
        user: { login: "alice" },
      },
      {
        id: 2,
        line: 5,
        body: "reply",
        side: "RIGHT",
        in_reply_to_id: 1,
        path: "src/main.ts",
        user: { login: "bob" },
        created_at: "2026-05-30",
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
        line: 5,
        side: "RIGHT",
        body: "issue here",
        path: "src/main.ts",
        createdAt: "2026-05-30",
        user: { login: "alice" },
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
    vi.mocked(api.getPrDetails).mockResolvedValue(
      new Response(JSON.stringify({ head: { sha: "head123" } })),
    );

    vi.mocked(api.createComment).mockResolvedValue(
      new Response(JSON.stringify({ id: 1 })),
    );

    const result = await service.suggest({
      pr: 42,
      line: 10,
      file: "src/main.ts",
      replace: "const x = 1;",
    });

    expect(result.success).toBe(true);
    expect(result.commentId).toBe(1);

    expect(api.createComment).toHaveBeenCalledWith("owner/repo", 42, {
      line: 10,
      side: "RIGHT",
      path: "src/main.ts",
      commit_id: "head123",
      body: "```suggestion\nconst x = 1;\n```",
    });
  });

  it("applies suggestions", async () => {
    const comments = [
      {
        id: 1,
        line: 10,
        side: "RIGHT",
        path: "src/main.ts",
        createdAt: "2026-05-30",
        user: { login: "alice" },
        body: "```suggestion\nconst x = 2;\n```",
        diff_hunk: "@@ -10 +10 @@\n-const x = 1;\n+const x = 1;",
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
