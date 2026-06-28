import { beforeEach, describe, expect, it, vi } from "vitest";

import output from "@/core/output";
import pagesApi from "@/api/pages";
import pagesService from "@/services/pages";
import { NotFoundError } from "@/core/errors";
import type { PagesSite, PagesBuild } from "@/types";

vi.mock("@/api/pages", () => ({
  default: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    requestBuild: vi.fn(),
    getLatestBuild: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: { log: vi.fn(), renderSummary: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

const site: PagesSite = {
  url: "api",
  status: "built",
  htmlUrl: "html",
  buildType: "legacy",
  httpsEnforced: true,
  source: { branch: "main", path: "/" },
};

const build: PagesBuild = { url: "build", status: "queued", commit: "abc" };

describe("pages service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports an unconfigured site", async () => {
    vi.mocked(pagesApi.get).mockRejectedValue(new NotFoundError("missing"));

    await expect(pagesService.status("owner/repo")).resolves.toMatchObject({
      configured: false,
      site: null,
      build: null,
    });

    expect(output.log).toHaveBeenCalled();
  });

  it("reports site and latest build status", async () => {
    vi.mocked(pagesApi.get).mockResolvedValue(site);
    vi.mocked(pagesApi.getLatestBuild).mockResolvedValue(build);

    await expect(pagesService.status("owner/repo")).resolves.toMatchObject({
      site,
      build,
      configured: true,
    });

    expect(output.renderSummary).toHaveBeenCalled();
  });

  it("reports a configured site when no build exists", async () => {
    vi.mocked(pagesApi.get).mockResolvedValue(site);

    vi.mocked(pagesApi.getLatestBuild).mockRejectedValue(
      new NotFoundError("missing"),
    );

    await expect(pagesService.status("owner/repo")).resolves.toMatchObject({
      build: null,
      configured: true,
    });
  });

  it("propagates unexpected status failures", async () => {
    vi.mocked(pagesApi.get).mockRejectedValue(new Error("network"));
    await expect(pagesService.status("owner/repo")).rejects.toThrow("network");
  });

  it("creates a site and requests a build", async () => {
    vi.mocked(pagesApi.get).mockRejectedValue(new NotFoundError("missing"));
    vi.mocked(pagesApi.create).mockResolvedValue(site);
    vi.mocked(pagesApi.requestBuild).mockResolvedValue(build);

    await expect(
      pagesService.deploy("owner/repo", { source: "main", path: "/docs" }),
    ).resolves.toMatchObject({ created: true, build });

    expect(pagesApi.create).toHaveBeenCalledWith(
      "owner/repo",
      {
        branch: "main",
        path: "/docs",
      },
      "legacy",
    );
  });

  it("creates a site with workflow build type", async () => {
    vi.mocked(pagesApi.get).mockRejectedValue(new NotFoundError("missing"));
    vi.mocked(pagesApi.create).mockResolvedValue(site);
    vi.mocked(pagesApi.requestBuild).mockResolvedValue(build);

    await expect(
      pagesService.deploy("owner/repo", {
        source: "main",
        path: "/docs",
        buildType: "workflow",
      }),
    ).resolves.toMatchObject({ created: true, build });

    expect(pagesApi.create).toHaveBeenCalledWith(
      "owner/repo",
      {
        branch: "main",
        path: "/docs",
      },
      "workflow",
    );
  });

  it("updates an existing site before requesting a build", async () => {
    vi.mocked(pagesApi.get).mockResolvedValue(site);
    vi.mocked(pagesApi.requestBuild).mockResolvedValue(build);
    await pagesService.deploy("owner/repo", { source: "release/x" });

    expect(pagesApi.update).toHaveBeenCalledWith(
      "owner/repo",
      {
        branch: "release/x",
        path: "/",
      },
      "legacy",
    );
    expect(pagesApi.requestBuild).toHaveBeenCalled();
  });

  it("updates an existing site with workflow build type", async () => {
    vi.mocked(pagesApi.get).mockResolvedValue(site);
    vi.mocked(pagesApi.requestBuild).mockResolvedValue(build);

    await pagesService.deploy("owner/repo", {
      source: "main",
      buildType: "workflow",
    });

    expect(pagesApi.update).toHaveBeenCalledWith(
      "owner/repo",
      {
        branch: "main",
        path: "/",
      },
      "workflow",
    );
  });

  it("rejects invalid source options", async () => {
    await expect(
      pagesService.deploy("owner/repo", { source: "", path: "/" }),
    ).rejects.toThrow("source branch");

    await expect(
      pagesService.deploy("owner/repo", { source: "main", path: "/site" }),
    ).rejects.toThrow("must be");
  });

  it("rejects invalid build type", async () => {
    await expect(
      pagesService.deploy("owner/repo", {
        source: "main",
        buildType: "invalid",
      }),
    ).rejects.toThrow("build type");
  });

  it("unpublishes and translates a missing site", async () => {
    await expect(pagesService.unpublish("owner/repo")).resolves.toEqual({
      success: true,
    });

    vi.mocked(pagesApi.remove).mockRejectedValue(new NotFoundError("missing"));
    await expect(pagesService.unpublish("owner/repo")).rejects.toThrow(
      "not configured",
    );
  });
});
