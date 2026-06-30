import {
  text,
  inferRepo,
  repoInput,
  booleanValue,
  requiredText,
} from "./shared";
import type { TuiOperation } from "../types";
import workflowService from "@/services/workflow";

const workflowOperations: TuiOperation[] = [
  {
    workspace: "Workflow",
    id: "workflow.list",
    title: "List Workflows",
    command: "ghg workflow list",
    description: "List repository workflows.",
    inputs: [
      repoInput,
      { key: "all", label: "Include disabled", type: "boolean" },
    ],
    run: async ({ values }) =>
      workflowService.list(text(values, "repo") || (await inferRepo()), {
        all: booleanValue(values, "all"),
      }),
  },
  {
    workspace: "Workflow",
    id: "workflow.view",
    title: "View Workflow",
    command: "ghg workflow view <name-or-id>",
    description: "View a repository workflow.",
    inputs: [
      repoInput,
      { key: "workflow", label: "Name or ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      workflowService.view(
        requiredText(values, "workflow"),
        text(values, "repo") || (await inferRepo()),
      ),
  },
  {
    mutates: true,
    workspace: "Workflow",
    id: "workflow.run",
    title: "Run Workflow",
    command: "ghg workflow run <name-or-id>",
    description: "Dispatch a repository workflow.",
    inputs: [
      repoInput,
      { key: "workflow", label: "Name or ID", type: "string", required: true },
      { key: "ref", label: "Branch or tag", type: "string" },
      { key: "fields", label: "Fields (one per line)", type: "string" },
    ],
    run: async ({ values }) =>
      workflowService.run(requiredText(values, "workflow"), {
        repo: text(values, "repo") || (await inferRepo()),
        ref: text(values, "ref"),
        fields: text(values, "fields")
          ?.split("\n")
          .map((field) => field.trim())
          .filter(Boolean),
      }),
  },
  ...[true, false].map(
    (enabled): TuiOperation => ({
      mutates: true,
      workspace: "Workflow",
      id: `workflow.${enabled ? "enable" : "disable"}`,
      title: `${enabled ? "Enable" : "Disable"} Workflow`,
      command: `ghg workflow ${enabled ? "enable" : "disable"} <name-or-id>`,
      description: `${enabled ? "Enable" : "Disable"} a repository workflow.`,
      inputs: [
        repoInput,
        {
          key: "workflow",
          label: "Name or ID",
          type: "string",
          required: true,
        },
      ],
      run: async ({ values }) =>
        workflowService.setEnabled(
          requiredText(values, "workflow"),
          text(values, "repo") || (await inferRepo()),
          enabled,
        ),
    }),
  ),
  {
    workspace: "Workflow",
    id: "workflow.validate",
    title: "Validate Workflows",
    command: "ghg workflow validate",
    description: "Validate GitHub Actions workflow files.",
    inputs: [{ key: "path", label: "Path", type: "string" }],
    run: ({ values }) => workflowService.validate(text(values, "path")),
  },

  {
    workspace: "Workflow",
    id: "workflow.preview",
    title: "Preview Workflows",
    command: "ghg workflow preview",
    description: "Preview GitHub Actions workflow structure.",
    inputs: [{ key: "path", label: "Path", type: "string" }],
    run: ({ values }) => workflowService.preview(text(values, "path")),
  },
];

const operationOrder = [
  "workflow.validate",
  "workflow.preview",
  "workflow.list",
  "workflow.view",
  "workflow.run",
  "workflow.enable",
  "workflow.disable",
];

workflowOperations.sort(
  (left, right) =>
    operationOrder.indexOf(left.id) - operationOrder.indexOf(right.id),
);

export default workflowOperations;
