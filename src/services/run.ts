import fs from "fs";
import path from "path";

import io from "@/core/io";
import output from "@/core/output";
import logger from "@/core/logger";
import checksApi from "@/api/checks";
import repoResolver from "@/core/repo";
import artifactsApi from "@/api/artifacts";
import workflowsApi from "@/api/workflows";

import { RunDebugResult } from "@/types";

import { DEFAULT_OUTPUT_DIR } from "@/core/constants";

interface WorkflowRunResponse {
  id: number;
  name?: string;
  event?: string;
  status: string;
  html_url?: string;
  run_number?: number;
  created_at?: string;
  head_branch?: string;
  conclusion: string | null;
}

interface ListRunOptions {
  repo: string;
  limit?: number;
  branch?: string;
  status?: string;
  workflow?: string;
}

interface DownloadRunOptions {
  repo: string;
  pattern?: string;
  outputDir?: string;
}

const normalizeRun = (run: WorkflowRunResponse) => ({
  id: run.id,
  status: run.status,
  name: run.name ?? "",
  event: run.event ?? "",
  url: run.html_url ?? "",
  conclusion: run.conclusion,
  number: run.run_number ?? 0,
  branch: run.head_branch ?? "",
  createdAt: run.created_at ?? "",
});

const list = async (options: ListRunOptions) => {
  const response = await workflowsApi.listRuns(options.repo, {
    branch: options.branch,
    status: options.status,
    limit: options.limit ?? 30,
    workflow: options.workflow,
  });

  const data = (await response.json()) as {
    workflow_runs?: WorkflowRunResponse[];
  };

  const runs = (data.workflow_runs ?? []).map(normalizeRun);
  output.renderTable(runs, { emptyMessage: "No workflow runs found." });
  return { success: true, runs };
};

const view = async (runId: number, repo: string) => {
  const response = await workflowsApi.getRun(repo, runId);
  const run = normalizeRun((await response.json()) as WorkflowRunResponse);

  output.renderSummary("Workflow Run", [
    ["Run", run.id],
    ["Name", run.name],
    ["Branch", run.branch],
    ["Status", run.status],
    ["Conclusion", run.conclusion ?? "n/a"],
    ["URL", run.url],
  ]);

  return { success: true, run };
};

const cancel = async (runId: number, repo: string) => {
  await workflowsApi.cancelRun(repo, runId);
  logger.success(`Cancelled workflow run ${runId}.`);
  return { success: true, runId };
};

const rerun = async (runId: number, repo: string, failedJobs = false) => {
  await workflowsApi.rerun(repo, runId, failedJobs);
  logger.success(`Requested rerun for workflow run ${runId}.`);
  return { success: true, runId, failedJobs };
};

const remove = async (runId: number, repo: string) => {
  await workflowsApi.deleteRun(repo, runId);
  logger.success(`Deleted workflow run ${runId}.`);
  return { success: true, runId };
};

const watch = async (runId: number, repo: string) => {
  let run: ReturnType<typeof normalizeRun>;
  do {
    const response = await workflowsApi.getRun(repo, runId);
    run = normalizeRun((await response.json()) as WorkflowRunResponse);

    logger.info(
      `Run ${runId}: ${run.status}${run.conclusion ? ` (${run.conclusion})` : ""}`,
    );

    if (run.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  } while (run.status !== "completed");

  return { success: true, run };
};

const download = async (runId: number, options: DownloadRunOptions) => {
  const response = await artifactsApi.listRunArtifacts(options.repo, runId);
  const data = (await response.json()) as ArtifactsResponse;

  const expression = options.pattern
    ? new RegExp(
        `^${options.pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
      )
    : null;

  const artifacts = (data.artifacts ?? []).filter(
    (artifact) => !expression || expression.test(artifact.name),
  );

  const outputDir = path.resolve(options.outputDir ?? DEFAULT_OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });
  const files: string[] = [];

  for (const artifact of artifacts) {
    const target = path.join(
      outputDir,
      `${io.safeFilename(artifact.name, `artifact-${artifact.id}`)}.zip`,
    );

    const artifactResponse = await artifactsApi.downloadArtifact(
      options.repo,
      artifact.id,
    );

    fs.writeFileSync(target, Buffer.from(await artifactResponse.arrayBuffer()));
    files.push(target);
  }

  logger.success(`Downloaded ${files.length} workflow artifact(s).`);
  return { success: true, runId, files };
};

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

const debugRun = async (
  runId: number,
  options: { repo?: string; outputDir?: string } = {},
) => {
  const repo = await repoResolver.resolveRepo(options.repo);
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
  list,
  view,
  watch,
  rerun,
  cancel,
  remove,
  download,
  debugRun,
};
