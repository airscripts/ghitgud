import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import checksApi from "@/api/checks";
import repoResolver from "@/core/repo";
import runService from "@/services/run";
import artifactsApi from "@/api/artifacts";
import workflowsApi from "@/api/workflows";
import { jsonResponse, binaryResponse } from "../helpers/response";

import {
  makeArtifact,
  makeWorkflowJob,
  makeWorkflowRun,
} from "../helpers/github";

vi.mock("@/api/checks", () => ({
  default: {
    getCheckRun: vi.fn(),
    listCheckRunAnnotations: vi.fn(),
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
    rerun: vi.fn(),
    getRun: vi.fn(),
    listRuns: vi.fn(),
    cancelRun: vi.fn(),
    deleteRun: vi.fn(),
    listRunJobs: vi.fn(),
    downloadRunLogs: vi.fn(),
  },
}));

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepo: vi.fn(() => Promise.resolve("owner/repo")),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
    renderSection: vi.fn(),
    log: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    info: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

describe("run service", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gitfleet-run-"));
    vi.mocked(repoResolver.resolveRepo).mockResolvedValue("owner/repo");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("writes run debug logs, artifacts, jobs, and annotations", async () => {
    vi.mocked(workflowsApi.getRun).mockResolvedValue(
      jsonResponse(makeWorkflowRun({ conclusion: "failure" })),
    );

    vi.mocked(workflowsApi.listRunJobs).mockResolvedValue(
      jsonResponse({ jobs: [makeWorkflowJob()] }),
    );

    vi.mocked(artifactsApi.listRunArtifacts).mockResolvedValue(
      jsonResponse({
        artifacts: [makeArtifact({ id: 789, name: "dist/package?" })],
      }),
    );

    vi.mocked(workflowsApi.downloadRunLogs).mockResolvedValue(
      binaryResponse("logs"),
    );

    vi.mocked(artifactsApi.downloadArtifact).mockResolvedValue(
      binaryResponse("artifact"),
    );

    vi.mocked(checksApi.getCheckRun).mockResolvedValue(jsonResponse({ id: 1 }));
    vi.mocked(checksApi.listCheckRunAnnotations).mockResolvedValue(
      jsonResponse([
        {
          message: "failed",
          path: "src/index.ts",
          annotation_level: "failure",
        },
      ]),
    );

    const result = await runService.debugRun(123, { outputDir: tempDir });

    expect(result.success).toBe(true);
    expect(result.metadata.jobs).toHaveLength(1);

    expect(result.metadata.annotations).toEqual([
      { path: "src/index.ts", message: "failed", level: "failure" },
    ]);

    expect(fs.existsSync(path.join(tempDir, "run-123", "logs.zip"))).toBe(true);
    expect(
      fs.existsSync(path.join(tempDir, "run-123", "dist_package.zip")),
    ).toBe(true);
  });

  it("uses git remote fallback and handles empty jobs/artifacts", async () => {
    vi.mocked(workflowsApi.getRun).mockResolvedValue(
      jsonResponse(makeWorkflowRun({ conclusion: null })),
    );

    vi.mocked(workflowsApi.listRunJobs).mockResolvedValue(jsonResponse({}));
    vi.mocked(artifactsApi.listRunArtifacts).mockResolvedValue(
      jsonResponse({}),
    );

    vi.mocked(workflowsApi.downloadRunLogs).mockResolvedValue(
      binaryResponse("logs"),
    );

    const result = await runService.debugRun(123, { outputDir: tempDir });
    expect(result.metadata.repo).toBe("owner/repo");
    expect(result.metadata.jobs).toEqual([]);
    expect(result.metadata.artifacts).toEqual([]);
    expect(result.metadata.annotations).toEqual([]);
  });

  it("manages workflow run lifecycle", async () => {
    const completed = makeWorkflowRun({
      status: "completed",
      conclusion: "success",
    });

    vi.mocked(workflowsApi.listRuns).mockResolvedValue(
      jsonResponse({ workflow_runs: [completed] }),
    );

    vi.mocked(workflowsApi.getRun).mockImplementation(async () =>
      jsonResponse(completed),
    );

    vi.mocked(workflowsApi.listRunJobs).mockResolvedValue(
      jsonResponse({ jobs: [] }),
    );

    expect((await runService.list({ repo: "owner/repo" })).runs).toHaveLength(
      1,
    );

    vi.mocked(workflowsApi.listRuns).mockResolvedValueOnce(jsonResponse({}));
    expect(
      (
        await runService.list({
          limit: 1,
          branch: "main",
          status: "success",
          workflow: "ci.yml",
          repo: "owner/repo",
        })
      ).runs,
    ).toEqual([]);

    expect((await runService.view(123, "owner/repo")).run.status).toBe(
      "completed",
    );

    await runService.cancel(123, "owner/repo");
    await runService.rerun(123, "owner/repo", true);
    await runService.remove(123, "owner/repo");

    expect((await runService.watch(123, "owner/repo")).conclusion).toBe(
      "success",
    );
  });

  it("downloads matching workflow artifacts", async () => {
    vi.mocked(artifactsApi.listRunArtifacts).mockResolvedValue(
      jsonResponse({ artifacts: [makeArtifact({ id: 7, name: "dist" })] }),
    );

    vi.mocked(artifactsApi.downloadArtifact).mockResolvedValue(
      binaryResponse("artifact"),
    );

    const result = await runService.download(123, {
      pattern: "d*",
      repo: "owner/repo",
      outputDir: tempDir,
    });

    expect(result.files).toHaveLength(1);
  });
});
