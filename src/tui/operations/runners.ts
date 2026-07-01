import type { TuiOperation } from "../types";
import runnerService from "@/services/runner";
import { text, numberValue, repoInput } from "./shared";

const orgInput = {
  key: "org",
  type: "string" as const,
  label: "Organization",
};

const runnerOperations: TuiOperation[] = [
  {
    workspace: "Runners",
    id: "runner.list",
    title: "List Runners",
    command: "gitfleet runner list",
    description: "List self-hosted runners.",
    inputs: [
      repoInput,
      orgInput,
      { key: "label", label: "Label filter", type: "string" },
    ],
    run: async ({ values }) =>
      runnerService.list({
        repo: text(values, "repo"),
        org: text(values, "org"),
        label: text(values, "label"),
      }),
  },
  {
    workspace: "Runners",
    id: "runner.view",
    title: "View Runner",
    command: "gitfleet runner view <id>",
    description: "View runner details.",
    inputs: [
      { key: "id", label: "Runner ID", type: "number", required: true },
      repoInput,
      orgInput,
    ],
    run: async ({ values }) =>
      runnerService.view(numberValue(values, "id"), {
        repo: text(values, "repo"),
        org: text(values, "org"),
      }),
  },
  {
    workspace: "Runners",
    id: "runner.status",
    title: "Runner Status",
    command: "gitfleet runner status <id>",
    description: "Show runner health and busy status.",
    inputs: [
      { key: "id", label: "Runner ID", type: "number", required: true },
      repoInput,
      orgInput,
    ],
    run: async ({ values }) =>
      runnerService.status(numberValue(values, "id"), {
        repo: text(values, "repo"),
        org: text(values, "org"),
      }),
  },
  {
    mutates: true,
    workspace: "Runners",
    id: "runner.remove",
    title: "Remove Runner",
    command: "gitfleet runner remove <id> --yes",
    description: "Remove a self-hosted runner.",
    inputs: [
      { key: "id", label: "Runner ID", type: "number", required: true },
      repoInput,
      orgInput,
    ],
    run: async ({ values }) =>
      runnerService.remove(numberValue(values, "id"), {
        repo: text(values, "repo"),
        org: text(values, "org"),
        yes: true,
      }),
  },
  {
    workspace: "Runners",
    id: "runner.labels",
    title: "List Runner Labels",
    command: "gitfleet runner labels <id>",
    description: "List labels for a runner.",
    inputs: [
      { key: "id", label: "Runner ID", type: "number", required: true },
      repoInput,
      orgInput,
    ],
    run: async ({ values }) =>
      runnerService.labels(numberValue(values, "id"), {
        repo: text(values, "repo"),
        org: text(values, "org"),
      }),
  },
];

export default runnerOperations;
