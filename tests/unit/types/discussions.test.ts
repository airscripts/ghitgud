import { describe, it, expect } from "vitest";

import type {
  Discussion,
  DiscussionCategory,
  DiscussionComment,
  DiscussionCreateInput,
  DiscussionCommentInput,
} from "@/types/discussions";

describe("discussions types", () => {
  it("has Discussion type with expected fields", () => {
    const d: Discussion = {
      id: "1",
      url: "https://github.com/org/repo/discussions/1",
      body: "body",
      title: "title",
      number: 1,
      author: "octocat",
      closed: false,
      category: "General",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      commentsCount: 5,
    };

    expect(d.id).toBe("1");
    expect(d.closed).toBe(false);
  });

  it("has DiscussionCategory type", () => {
    const cat: DiscussionCategory = {
      id: "1",
      name: "General",
      emoji: null,
      description: null,
    };

    expect(cat.name).toBe("General");
  });

  it("has DiscussionComment type", () => {
    const comment: DiscussionComment = {
      id: "1",
      body: "comment",
      author: "octocat",
      createdAt: "2026-01-01",
    };

    expect(comment.author).toBe("octocat");
  });

  it("has DiscussionCreateInput type", () => {
    const input: DiscussionCreateInput = {
      title: "title",
      body: "body",
      categoryId: "1",
      repositoryId: "2",
    };

    expect(input.title).toBe("title");
  });

  it("has DiscussionCommentInput type", () => {
    const input: DiscussionCommentInput = {
      body: "comment",
      discussionId: "1",
    };

    expect(input.discussionId).toBe("1");
  });
});
