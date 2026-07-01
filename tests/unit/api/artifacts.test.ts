import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/api/client";
import artifacts from "@/api/artifacts";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
  },
}));

describe("artifacts api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists run artifacts", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({ ok: true });
    await artifacts.listRunArtifacts("owner/repo", 123);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runs/123/artifacts",
    );
  });

  it("downloads artifact", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({ ok: true });
    await artifacts.downloadArtifact("owner/repo", 456);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/artifacts/456/zip",
    );
  });
});
