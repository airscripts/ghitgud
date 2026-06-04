import { text } from "./shared";
import type { TuiOperation } from "../types";
import workflowService from "@/services/workflow";

const workflowOperations: TuiOperation[] = [
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

export default workflowOperations;
