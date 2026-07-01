import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/providers/github/client";
import artifacts from "@/api/artifacts";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
  },
}));

describe("artifacts api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists run artifacts", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue(new Response());
    await artifacts.listRunArtifacts("owner/repo", 123);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runs/123/artifacts",
    );
  });

  it("downloads artifact", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue(new Response());
    await artifacts.downloadArtifact("owner/repo", 456);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/artifacts/456/zip",
    );
  });
});
