import { describe, it, expect, vi, beforeEach } from "vitest";

import cache from "@/api/cache";
import client from "@/providers/github/client";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("cache api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists without a key and deletes by id", async () => {
    await cache.listCaches("owner/repo", undefined, 30);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/caches?per_page=30",
    );

    await cache.deleteCache("owner/repo", 123);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/caches/123",
    );
  });

  it("lists caches with encoded key query", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await cache.listCaches("owner/repo", "node cache/key");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/caches?key=node+cache%2Fkey&per_page=100",
    );
  });
});
