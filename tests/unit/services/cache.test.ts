import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import api from "@/api/cache";
import config from "@/core/config";
import artifactsApi from "@/api/artifacts";
import workflowsApi from "@/api/workflows";
import cacheService from "@/services/cache";
import { GhitgudError } from "@/core/errors";
import { makeArtifact, makeCacheEntry } from "../helpers/github";
import { binaryResponse, jsonResponse } from "../helpers/response";

vi.mock("@/api/cache", () => ({
  default: {
    listCaches: vi.fn(),
  },
}));

vi.mock("@/api/artifacts", () => ({
  default: {
    downloadArtifact: vi.fn(),
    listRunArtifacts: vi.fn(),
  },
}));

vi.mock("@/api/workflows", () => ({
  default: {
    getRun: vi.fn(),
    downloadRunLogs: vi.fn(),
  },
}));

vi.mock("@/core/config", () => ({
  default: {
    getRepoOptional: vi.fn(() => "owner/repo"),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    warn: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

describe("cache service", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ghg-cache-"));
    vi.mocked(config.getRepoOptional).mockReturnValue("owner/repo");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("inspects cache metadata", async () => {
    vi.mocked(api.listCaches).mockResolvedValue(
      jsonResponse({ actions_caches: [makeCacheEntry()] }),
    );

    const result = await cacheService.inspect("node-cache");
    expect(result.success).toBe(true);
    expect(result.repo).toBe("owner/repo");

    expect(result.metadata).toEqual([
      {
        id: 123,
        version: "v1",
        key: "cache-key",
        sizeInBytes: 100,
        ref: "refs/heads/main",
        createdAt: "2026-05-30T00:00:00Z",
        lastAccessedAt: "2026-05-31T00:00:00Z",
      },
    ]);
  });

  it("throws when download finds no cache entries", async () => {
    vi.mocked(api.listCaches).mockResolvedValue(
      jsonResponse({ actions_caches: [] }),
    );

    await expect(
      cacheService.download("missing", { outputDir: tempDir }),
    ).rejects.toThrow(GhitgudError);
  });

  it("writes cache debug bundle metadata, logs, and artifacts", async () => {
    vi.mocked(api.listCaches).mockResolvedValue(
      jsonResponse({
        actions_caches: [makeCacheEntry({ id: 987, key: "node/cache?" })],
      }),
    );

    vi.mocked(workflowsApi.getRun).mockResolvedValue(jsonResponse({ id: 987 }));
    vi.mocked(workflowsApi.downloadRunLogs).mockResolvedValue(
      binaryResponse("logs"),
    );

    vi.mocked(artifactsApi.listRunArtifacts).mockResolvedValue(
      jsonResponse({ artifacts: [makeArtifact({ name: "artifact/name" })] }),
    );

    vi.mocked(artifactsApi.downloadArtifact).mockResolvedValue(
      binaryResponse("artifact"),
    );

    const result = await cacheService.download("node/cache?", {
      outputDir: tempDir,
    });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "cache-node_cache.json"))).toBe(
      true,
    );

    expect(fs.existsSync(path.join(tempDir, "run-987-logs.zip"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "artifact_name.zip"))).toBe(true);
  });
});
