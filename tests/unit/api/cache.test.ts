import { describe, it, expect, vi, beforeEach } from "vitest";

import cache from "@/api/cache";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("cache api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
