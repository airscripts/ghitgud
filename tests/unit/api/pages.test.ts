import { beforeEach, describe, expect, it, vi } from "vitest";

import pages from "@/api/pages";
import client from "@/providers/github/client";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    putTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
  },
}));

const site = {
  url: "api-url",
  status: "built",
  build_type: "legacy",
  https_enforced: true,
  html_url: "https://owner.github.io/repo",
  source: { branch: "main", path: "/docs" },
};

describe("pages api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets and normalizes a Pages site", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response(JSON.stringify(site)));

    await expect(pages.get("owner/repo")).resolves.toMatchObject({
      buildType: "legacy",
      httpsEnforced: true,
      htmlUrl: "https://owner.github.io/repo",
    });

    expect(client.get).toHaveBeenCalledWith("/repos/owner/repo/pages");
  });

  it("gets and normalizes the latest build", async () => {
    vi.mocked(client.get).mockResolvedValue(
      new Response(
        JSON.stringify({
          commit: "abc",
          status: "built",
          url: "build-url",
          created_at: "created",
          updated_at: "updated",
          error: { message: "warning" },
        }),
      ),
    );

    await expect(pages.getLatestBuild("owner/repo")).resolves.toEqual({
      commit: "abc",
      status: "built",
      url: "build-url",
      error: "warning",
      createdAt: "created",
      updatedAt: "updated",
    });
  });

  it("creates, updates, builds, and removes a site", async () => {
    vi.mocked(client.postTokenRequired)
      .mockResolvedValueOnce(new Response(JSON.stringify(site)))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: "build", status: "queued" })),
      );

    vi.mocked(client.putTokenRequired).mockResolvedValue(new Response());
    vi.mocked(client.deleteTokenRequired).mockResolvedValue(new Response());
    const source = { branch: "main", path: "/docs" as const };

    await pages.create("owner/repo", source);
    await pages.update("owner/repo", source);
    await pages.requestBuild("owner/repo");
    await pages.remove("owner/repo");

    expect(client.postTokenRequired).toHaveBeenNthCalledWith(
      1,
      "/repos/owner/repo/pages",
      { build_type: "legacy", source },
    );

    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pages",
      { build_type: "legacy", source },
    );

    expect(client.postTokenRequired).toHaveBeenNthCalledWith(
      2,
      "/repos/owner/repo/pages/builds",
      {},
    );

    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pages",
    );
  });

  it("creates a site with workflow build type", async () => {
    vi.mocked(client.postTokenRequired).mockResolvedValue(
      new Response(JSON.stringify(site)),
    );

    const source = { branch: "main", path: "/" as const };
    await pages.create("owner/repo", source, "workflow");

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pages",
      { build_type: "workflow", source },
    );
  });

  it("updates a site with workflow build type", async () => {
    vi.mocked(client.putTokenRequired).mockResolvedValue(new Response());
    const source = { branch: "main", path: "/" as const };
    await pages.update("owner/repo", source, "workflow");

    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/pages",
      { build_type: "workflow", source },
    );
  });
});
