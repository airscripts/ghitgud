import forks from "@/api/forks";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn().mockReturnValue(30),
  },
}));

describe("forks api", () => {
  it("lists forks", () => {
    forks.list("owner/repo");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/forks"),
    );
  });

  it("creates a fork", () => {
    forks.create("owner/repo");
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/forks",
      {},
    );
  });

  it("creates a fork into an org", () => {
    forks.create("owner/repo", { org: "myorg" });
    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/forks",
      { organization: "myorg" },
    );
  });

  it("syncs a fork", async () => {
    (client.postTokenRequired as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve({
          message: "synced",
          merge_type: "merge",
          base_branch: "main",
        }),
    });
    const result = await forks.sync("owner/repo", "main");
    expect(result.message).toBe("synced");
  });

  it("compares branches", async () => {
    (client.getTokenRequired as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve({
          ahead_by: 3,
          behind_by: 1,
          status: "ahead",
          total_commits: 4,
        }),
    });
    const result = await forks.compare("owner/repo", "upstream:main", "main");
    expect(result.ahead_by).toBe(3);
  });
});
