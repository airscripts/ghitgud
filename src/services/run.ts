import fs from "fs";
import path from "path";

import io from "@/core/io";
import output from "@/core/output";
import logger from "@/core/logger";
import config from "@/core/config";
import checksApi from "@/api/checks";
import artifactsApi from "@/api/artifacts";
import workflowsApi from "@/api/workflows";

import { RunDebugResult } from "@/types";

import { DEFAULT_OUTPUT_DIR, ERROR_NO_REPO } from "@/core/constants";
import { ConfigError } from "@/core/errors";

interface WorkflowRunResponse {
  id: number;
  status: string;
  conclusion: string | null;
}

interface RunJobsResponse {
  jobs?: Array<{
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    check_run_url?: string | null;
  }>;
}

interface ArtifactsResponse {
  artifacts?: Array<{
    id: number;
    name: string;
    size_in_bytes: number;
    archive_download_url: string;
  }>;
}

function resolveRepo(repo?: string): string {
  const resolved = repo || config.getRepoOptional();
  if (!resolved) throw new ConfigError(ERROR_NO_REPO);
  return resolved;
}

const debugRun = async (
  runId: number,
  options: { repo?: string; outputDir?: string } = {},
) => {
  const repo = resolveRepo(options.repo);
  logger.start(`Loading debug data for run ${runId}.`);

  const runResponse = await workflowsApi.getRun(repo, runId);
  const runData = (await runResponse.json()) as WorkflowRunResponse;

  const jobsResponse = await workflowsApi.listRunJobs(repo, runId);
  const jobsData = (await jobsResponse.json()) as RunJobsResponse;

  const artifactsResponse = await artifactsApi.listRunArtifacts(repo, runId);
  const artifactsData = (await artifactsResponse.json()) as ArtifactsResponse;

  const outputDir = path.resolve(
    options.outputDir ?? DEFAULT_OUTPUT_DIR,
    `run-${runId}`,
  );

  fs.mkdirSync(outputDir, { recursive: true });
  const logsResponse = await workflowsApi.downloadRunLogs(repo, runId);
  const logsPath = path.join(outputDir, "logs.zip");
  fs.writeFileSync(logsPath, Buffer.from(await logsResponse.arrayBuffer()));

  const downloadedArtifacts: string[] = [];
  for (const artifact of artifactsData.artifacts ?? []) {
    const artifactResponse = await artifactsApi.downloadArtifact(
      repo,
      artifact.id,
    );

    const artifactPath = path.join(
      outputDir,
      `${io.safeFilename(artifact.name, `artifact-${artifact.id}`)}.zip`,
    );

    fs.writeFileSync(
      artifactPath,
      Buffer.from(await artifactResponse.arrayBuffer()),
    );

    downloadedArtifacts.push(artifactPath);
  }

  const annotations: Array<{ path: string; message: string; level: string }> =
    [];

  for (const job of jobsData.jobs ?? []) {
    if (!job.check_run_url) continue;

    const annotationResponse = await checksApi
      .listCheckRunAnnotations(job.check_run_url)
      .catch(() => null);

    if (!annotationResponse) continue;

    const annotationData = (await annotationResponse.json()) as Array<{
      path: string;
      message: string;
      annotation_level: string;
    }>;

    for (const annotation of annotationData) {
      annotations.push({
        path: annotation.path,
        message: annotation.message,
        level: annotation.annotation_level,
      });
    }
  }

  const result: RunDebugResult = {
    runId,
    repo,
    status: runData.status,
    conclusion: runData.conclusion,
    outputDir,
    jobs: (jobsData.jobs ?? []).map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      checkRunUrl: job.check_run_url ?? null,
    })),
    artifacts: (artifactsData.artifacts ?? []).map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      sizeInBytes: artifact.size_in_bytes,
      archiveDownloadUrl: artifact.archive_download_url,
    })),
    annotations,
    files: {
      logsZip: logsPath,
      artifacts: downloadedArtifacts,
    },
  };

  output.renderSummary("Run Debug", [
    ["Run", result.runId],
    ["Status", result.status],
    ["Conclusion", result.conclusion ?? "n/a"],
    ["Jobs", result.jobs.length],
    ["Artifacts", result.artifacts.length],
    ["Annotations", result.annotations.length],
  ]);

  output.renderTable(
    result.jobs.map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion ?? "n/a",
    })),
    { emptyMessage: "No jobs found for run." },
  );

  logger.success(`Run debug bundle written to ${outputDir}.`);
  return { success: true, metadata: result };
};

export default {
  debugRun,
};
