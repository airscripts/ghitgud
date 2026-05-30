import { describe, it, expect, vi } from "vitest";

import client from "@/api/client";
import reviewApi from "@/api/review";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
  },
}));

describe("review api", () => {
  it("lists comments for a PR", async () => {
    const mockResponse = new Response(JSON.stringify([]));
    vi.mocked(client.getTokenRequired).mockResolvedValue(mockResponse);

    const result = await reviewApi.listComments("owner/repo", 42);
    expect(result).toBe(mockResponse);

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/42/comments",
    );
  });

  it("creates a comment", async () => {
    const mockResponse = new Response(JSON.stringify({ id: 1 }));
    vi.mocked(client.postTokenRequired).mockResolvedValue(mockResponse);

    const body = {
      line: 10,
      commit_id: "abc123",
      path: "src/main.ts",
      body: "test comment",
    };

    const result = await reviewApi.createComment("owner/repo", 42, body);
    expect(result).toBe(mockResponse);

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/42/comments",
      body,
    );
  });

  it("updates a comment", async () => {
    const mockResponse = new Response(JSON.stringify({ id: 1 }));
    vi.mocked(client.patchTokenRequired).mockResolvedValue(mockResponse);

    const result = await reviewApi.updateComment("owner/repo", 123, {
      body: "updated",
    });

    expect(result).toBe(mockResponse);
    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/comments/123",
      { body: "updated" },
    );
  });

  it("lists PR files", async () => {
    const mockResponse = new Response(JSON.stringify([]));
    vi.mocked(client.getTokenRequired).mockResolvedValue(mockResponse);

    const result = await reviewApi.listFiles("owner/repo", 42);
    expect(result).toBe(mockResponse);

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/42/files",
    );
  });

  it("gets PR details", async () => {
    const mockResponse = new Response(
      JSON.stringify({ head: { ref: "main" } }),
    );

    vi.mocked(client.getTokenRequired).mockResolvedValue(mockResponse);
    const result = await reviewApi.getPrDetails("owner/repo", 42);
    expect(result).toBe(mockResponse);

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pulls/42",
    );
  });
});
