import { describe, expect, it, Mock, vi, beforeEach } from "vitest";

import client from "@/api/client";
import api from "@/api/discussions";
import discussionService from "@/services/discussion";

vi.mock("@/api/discussions", () => ({
  default: {
    get: vi.fn(),
    list: vi.fn(),
    close: vi.fn(),
    create: vi.fn(),
    comment: vi.fn(),
    categories: vi.fn(),
    parseRepo: vi.fn(() => ({ owner: "owner", name: "repo" })),
  },
}));

vi.mock("@/api/client", () => ({
  default: {
    graphqlTokenRequired: vi.fn(),
    getRepo: vi.fn(() => "owner/repo"),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    log: vi.fn(),
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
    renderSection: vi.fn(),
  },
}));

function buildDiscussionResponse(number: number) {
  return {
    json: () =>
      Promise.resolve({
        data: {
          repository: {
            discussion: {
              number,
              body: "Body",
              closed: false,
              id: `D_${number}`,
              createdAt: "2026-01-01",
              updatedAt: "2026-01-02",
              title: `Title ${number}`,
              author: { login: "user" },
              category: { name: "General" },

              comments: {
                nodes: [],
                totalCount: 0,
              },

              url: `https://github.com/owner/repo/discussions/${number}`,
            },
          },
        },
      }),
  };
}

function buildListResponse(nodes: unknown[]) {
  return {
    json: () =>
      Promise.resolve({
        data: {
          repository: {
            discussions: {
              nodes,
            },
          },
        },
      }),
  };
}

function buildCategoriesResponse(
  categories: Array<{
    id: string;
    name: string;
    emoji: string | null;
    description: string | null;
  }>,
) {
  return {
    json: () =>
      Promise.resolve({
        data: {
          repository: {
            discussionCategories: {
              nodes: categories,
            },
          },
        },
      }),
  };
}

describe("discussion service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists discussions", async () => {
    const node = {
      id: "D_1",
      number: 1,
      closed: false,
      title: "Hello",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
      author: { login: "alice" },
      comments: { totalCount: 2 },
      url: "https://example.com/1",
      category: { name: "General" },
    };

    (api.list as Mock).mockResolvedValue(buildListResponse([node]));
    const result = await discussionService.list();

    expect(api.list).toHaveBeenCalledWith("owner", "repo", undefined, 30);
    expect(result.success).toBe(true);
    expect(result.discussions).toHaveLength(1);
  });

  it("lists discussions with category filter", async () => {
    (api.categories as Mock).mockResolvedValue(
      buildCategoriesResponse([
        { id: "C1", name: "General", description: null, emoji: null },
      ]),
    );

    (api.list as Mock).mockResolvedValue(buildListResponse([]));
    const result = await discussionService.list({ category: "General" });

    expect(api.categories).toHaveBeenCalledWith("owner", "repo");
    expect(api.list).toHaveBeenCalledWith("owner", "repo", "C1", 30);
    expect(result.success).toBe(true);
  });

  it("views a discussion", async () => {
    (api.get as Mock).mockResolvedValue(buildDiscussionResponse(42));
    const result = await discussionService.view(42);

    expect(api.get).toHaveBeenCalledWith("owner", "repo", 42);
    expect(result.success).toBe(true);
    expect(result.discussion.number).toBe(42);
    expect(result.discussion.closed).toBe(false);
  });

  it("lists categories", async () => {
    (api.categories as Mock).mockResolvedValue(
      buildCategoriesResponse([
        {
          id: "C1",
          emoji: "💬",
          name: "General",
          description: "General topics",
        },
      ]),
    );

    const result = await discussionService.categories();
    expect(api.categories).toHaveBeenCalledWith("owner", "repo");
    expect(result.success).toBe(true);
    expect(result.categories).toHaveLength(1);
  });

  it("creates a discussion", async () => {
    (api.categories as Mock).mockResolvedValue(
      buildCategoriesResponse([
        { id: "C1", name: "General", description: null, emoji: null },
      ]),
    );

    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { repository: { id: "R_1" } },
        }),
    } as Response);

    (api.create as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            createDiscussion: {
              discussion: {
                id: "D_new",
                number: 99,
                title: "New",
                url: "https://example.com/99",
              },
            },
          },
        }),
    });

    const result = await discussionService.create({
      title: "New",
      body: "Body text",
      category: "General",
    });

    expect(api.create).toHaveBeenCalledWith("R_1", "C1", "New", "Body text");
    expect(result.success).toBe(true);
    expect(result.discussion.number).toBe(99);
  });

  it("adds a comment", async () => {
    (api.get as Mock).mockResolvedValue(buildDiscussionResponse(7));
    (api.comment as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            addDiscussionComment: {
              comment: {
                id: "CM_1",
                body: "Great!",
                createdAt: "2026-01-01",
              },
            },
          },
        }),
    });

    const result = await discussionService.comment("7", "Great!");
    expect(api.get).toHaveBeenCalledWith("owner", "repo", 7);
    expect(api.comment).toHaveBeenCalledWith("D_7", "Great!");
    expect(result.success).toBe(true);
  });

  it("closes a discussion", async () => {
    (api.get as Mock).mockResolvedValue(buildDiscussionResponse(5));
    (api.close as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            closeDiscussion: {
              discussion: { id: "D_5", number: 5, closed: true },
            },
          },
        }),
    });

    const result = await discussionService.close("5");
    expect(api.close).toHaveBeenCalledWith("D_5");
    expect(result.success).toBe(true);
    expect(result.closed).toBe(true);
  });

  it("rejects invalid discussion numbers", async () => {
    await expect(discussionService.view(-1)).rejects.toThrow(
      "Invalid discussion number: -1",
    );
  });
});
