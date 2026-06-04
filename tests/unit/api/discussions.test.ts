import { describe, expect, it, vi } from "vitest";

import client from "@/api/client";
import discussions from "@/api/discussions";

vi.mock("@/api/client", () => ({
  default: {
    graphqlTokenRequired: vi.fn(),
    getRepo: vi.fn(() => "owner/repo"),
  },
}));

describe("discussions api", () => {
  it("lists discussions for a repo", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.list("owner", "repo");
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("ListDiscussions"),
      {
        first: 30,
        name: "repo",
        owner: "owner",
        categoryId: null,
      },
    );
  });

  it("lists discussions with category filter and limit", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.list("owner", "repo", "cat123", 50);
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("ListDiscussions"),
      {
        first: 50,
        name: "repo",
        owner: "owner",
        categoryId: "cat123",
      },
    );
  });

  it("gets a discussion by number", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.get("owner", "repo", 42);
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("GetDiscussion"),
      {
        number: 42,
        name: "repo",
        owner: "owner",
      },
    );
  });

  it("lists categories", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.categories("owner", "repo");
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("ListCategories"),
      {
        name: "repo",
        owner: "owner",
      },
    );
  });

  it("creates a discussion", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.create("repo123", "cat456", "Title", "Body");
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("CreateDiscussion"),
      {
        body: "Body",
        title: "Title",
        categoryId: "cat456",
        repositoryId: "repo123",
      },
    );
  });

  it("adds a comment", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.comment("disc123", "Nice post");
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("AddDiscussionComment"),
      {
        body: "Nice post",
        discussionId: "disc123",
      },
    );
  });

  it("closes a discussion", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.close("disc123");
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("CloseDiscussion"),
      {
        discussionId: "disc123",
      },
    );
  });

  it("pins a discussion", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.pin("disc123");
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("PinDiscussion"),
      {
        discussionId: "disc123",
      },
    );
  });

  it("unpins a discussion", async () => {
    vi.mocked(client.graphqlTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await discussions.unpin("disc123");
    expect(client.graphqlTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("UnpinDiscussion"),
      {
        discussionId: "disc123",
      },
    );
  });

  it("parses repo strings", () => {
    expect(discussions.parseRepo("owner/repo")).toEqual({
      name: "repo",
      owner: "owner",
    });
  });

  it("throws on invalid repo format", () => {
    expect(() => discussions.parseRepo("bad")).toThrow(
      "Invalid repo format: bad",
    );
  });
});
