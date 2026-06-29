import runService from "@/services/run";
import type { TuiOperation } from "../types";

import {
  text,
  repoInput,
  inferRepo,
  numberValue,
  booleanValue,
} from "./shared";

const runOperations: TuiOperation[] = [
  {
    id: "run.list",
    workspace: "Run",
    title: "List Workflow Runs",
    command: "ghg run list",
    description: "List repository workflow runs.",

    inputs: [
      repoInput,
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],

    run: async ({ values }) =>
      runService.list({
        repo: text(values, "repo") || (await inferRepo()),
        limit: Number(values.limit ?? 30),
      }),
  },

  ...[
    ["view", "view", "View Workflow Run"],
    ["cancel", "cancel", "Cancel Workflow Run"],
    ["delete", "remove", "Delete Workflow Run"],
    ["watch", "watch", "Watch Workflow Run"],
  ].map(
    ([action, serviceAction, title]): TuiOperation => ({
      title,
      workspace: "Run",
      id: `run.${action}`,
      description: `${title}.`,
      command: `ghg run ${action} <run-id>`,
      mutates: action === "cancel" || action === "delete",

      inputs: [
        repoInput,
        { key: "runId", label: "Run ID", type: "number", required: true },
      ],

      run: async ({ values }) =>
        runService[serviceAction as "view" | "cancel" | "remove" | "watch"](
          numberValue(values, "runId"),
          text(values, "repo") || (await inferRepo()),
        ),
    }),
  ),

  {
    id: "run.rerun",
    workspace: "Run",
    title: "Rerun Workflow Run",
    command: "ghg run rerun <run-id>",
    description: "Rerun all or only failed jobs.",
    mutates: true,

    inputs: [
      repoInput,
      { key: "runId", label: "Run ID", type: "number", required: true },
      { key: "failedJobs", label: "Failed jobs only", type: "boolean" },
    ],

    run: async ({ values }) =>
      runService.rerun(
        numberValue(values, "runId"),
        text(values, "repo") || (await inferRepo()),
        booleanValue(values, "failedJobs"),
      ),
  },

  {
    workspace: "Run",
    id: "run.download",
    title: "Download Run Artifacts",
    command: "ghg run download <run-id>",
    description: "Download workflow run artifacts.",
    mutates: true,

    inputs: [
      repoInput,
      { key: "runId", label: "Run ID", type: "number", required: true },
      { key: "pattern", label: "Pattern", type: "string" },
      { key: "outputDir", label: "Output dir", type: "string" },
    ],

    run: async ({ values }) =>
      runService.download(numberValue(values, "runId"), {
        repo: text(values, "repo") || (await inferRepo()),
        pattern: text(values, "pattern"),
        outputDir: text(values, "outputDir"),
      }),
  },

  {
    mutates: true,
    id: "run.debug",
    workspace: "Run",
    title: "Debug Workflow Run",
    command: "ghg run debug <run-id>",
    description: "Fetch logs, artifacts, and annotations for a run.",

    inputs: [
      repoInput,
      { key: "runId", label: "Run ID", type: "number", required: true },
      { key: "outputDir", label: "Output dir", type: "string" },
    ],

    run: async ({ values }) =>
      runService.debugRun(numberValue(values, "runId"), {
        repo: text(values, "repo") || (await inferRepo()),
        outputDir: text(values, "outputDir"),
      }),
  },
];

export default runOperations;
