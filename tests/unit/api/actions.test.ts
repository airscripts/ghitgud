import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/api/client";
import checks from "@/api/checks";
import commits from "@/api/commits";
import artifacts from "@/api/artifacts";
import workflows from "@/api/workflows";
import { GhitgudError } from "@/core/errors";

vi.mock("@/api/client", () => ({
  default: {
    getPaginated: vi.fn(),
    getTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("actions-related api wrappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds artifact endpoints", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await artifacts.listRunArtifacts("owner/repo", 123);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runs/123/artifacts",
    );

    await artifacts.downloadArtifact("owner/repo", 456);
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/artifacts/456/zip",
    );
  });

  it("builds workflow run endpoints", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await workflows.getRun("owner/repo", 123);
    await workflows.listRunJobs("owner/repo", 123);
    await workflows.downloadRunLogs("owner/repo", 123);

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runs/123",
    );

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runs/123/jobs",
    );

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/runs/123/logs",
    );
  });

  it("maps check run api urls to relative endpoints", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await checks.getCheckRun(
      "https://api.github.com/repos/owner/repo/check-runs/1",
    );

    await checks.listCheckRunAnnotations(
      "https://api.github.com/repos/owner/repo/check-runs/1",
    );

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/check-runs/1",
    );

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/check-runs/1/annotations",
    );
  });

  it("rejects unexpected check run urls", async () => {
    await expect(
      checks.getCheckRun("https://example.com/check"),
    ).rejects.toThrow(GhitgudError);
  });

  it("uses pagination for contributors", async () => {
    vi.mocked(client.getPaginated).mockResolvedValue([{ id: 1 }]);

    const result = await commits.contributors("owner/repo");

    expect(result).toEqual([{ id: 1 }]);
    expect(client.getPaginated).toHaveBeenCalledWith(
      "/repos/owner/repo/contributors?per_page=100",
    );
  });
});
