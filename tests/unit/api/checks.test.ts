import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/providers/github/client";
import checks from "@/api/checks";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
  },
}));

describe("checks api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets a check run", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue(new Response());
    await checks.getCheckRun(
      "https://api.github.com/repos/owner/repo/check-runs/123",
    );
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/check-runs/123",
    );
  });

  it("lists check run annotations", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue(new Response());
    await checks.listCheckRunAnnotations(
      "https://api.github.com/repos/owner/repo/check-runs/123",
    );
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/check-runs/123/annotations",
    );
  });

  it("throws for unexpected check run URL format", async () => {
    await expect(
      checks.getCheckRun("https://example.com/invalid"),
    ).rejects.toThrow("Unexpected check run URL format");
  });
});
