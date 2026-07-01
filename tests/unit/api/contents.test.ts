import client from "@/providers/github/client";
import contents from "@/api/contents";
import { NotFoundError } from "@/core/errors";
import { describe, it, expect, vi, Mock } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("contents api", () => {
  it("should list repository root contents", async () => {
    (client.get as Mock).mockResolvedValue({
      json: () => Promise.resolve([{ name: "README.md", path: "README.md" }]),
    });

    const result = await contents.list("owner/repo");
    expect(client.get).toHaveBeenCalledWith("/repos/owner/repo/contents");
    expect(result).toEqual([{ name: "README.md", path: "README.md" }]);
  });

  it("should encode content path segments", async () => {
    (client.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          type: "file",
          name: "API #1.md",
          path: "docs/API #1.md",
        }),
    });

    const result = await contents.list("owner/repo", "docs/API #1.md");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/contents/docs/API%20%231.md",
    );

    expect(result).toEqual([
      { name: "API #1.md", path: "docs/API #1.md", type: "file" },
    ]);
  });

  it("should return false when encoded path is not found", async () => {
    (client.get as Mock).mockRejectedValue(
      new NotFoundError("Resource not found."),
    );

    const result = await contents.exists("owner/repo", "docs/API #1.md");

    expect(result).toBe(false);
    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/contents/docs/API%20%231.md",
    );
  });
});
