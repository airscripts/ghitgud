import runService from "@/services/run";
import type { TuiOperation } from "../types";
import { repoInput, text, numberValue } from "./shared";

const runOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "run.debug",
    workspace: "Run",
    title: "Debug Workflow Run",
    command: "ghg run debug <run-id>",
    description: "Fetch logs, artifacts, and annotations for a run.",

    inputs: [
      { key: "runId", label: "Run ID", type: "number", required: true },
      repoInput,
      { key: "outputDir", label: "Output dir", type: "string" },
    ],

    run: ({ values }) =>
      runService.debugRun(numberValue(values, "runId"), {
        repo: text(values, "repo"),
        outputDir: text(values, "outputDir"),
      }),
  },
];

export default runOperations;
