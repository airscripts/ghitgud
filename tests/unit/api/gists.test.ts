import { describe, it, expect, vi } from "vitest";

import api from "@/api/gists";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    putTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
  },
}));

describe("gists api", () => {
  it("builds list, view, and mutation endpoints", async () => {
    await api.list(true, 10);
    await api.get("abc/123");
    await api.create({ files: { "a.txt": { content: "a" } } });
    await api.update("abc", { files: { "a.txt": null } });
    await api.remove("abc");

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/gists/public?per_page=10",
    );
    expect(client.getTokenRequired).toHaveBeenCalledWith("/gists/abc%2F123");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/gists",
      expect.any(Object),
    );
    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/gists/abc",
      expect.any(Object),
    );
    expect(client.deleteTokenRequired).toHaveBeenCalledWith("/gists/abc");
  });

  it("builds fork, star, unstar, and comment endpoints", async () => {
    await api.fork("xyz");
    await api.star("xyz");
    await api.unstar("xyz");
    await api.listComments("xyz");
    await api.createComment("xyz", "hello");
    await api.deleteComment("xyz", 42);

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/gists/xyz/forks",
      {},
    );
    expect(client.putTokenRequired).toHaveBeenCalledWith("/gists/xyz/star", {});
    expect(client.deleteTokenRequired).toHaveBeenCalledWith("/gists/xyz/star");
    expect(client.getTokenRequired).toHaveBeenCalledWith("/gists/xyz/comments");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/gists/xyz/comments",
      { body: "hello" },
    );
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/gists/xyz/comments/42",
    );
  });
});
