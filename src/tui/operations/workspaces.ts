import type { TuiOperation } from "../types";
import workspaceService from "@/services/workspace";
import { requiredText } from "./shared";

const workspaceOperations: TuiOperation[] = [
  {
    workspace: "Workspaces",
    id: "workspace.define",
    title: "Define Workspace",
    command: "gitfleet workspace define --name <name> --repos <list>",
    description: "Define or update a named workspace.",
    mutates: true,
    inputs: [
      { key: "name", label: "Workspace name", type: "string", required: true },
      {
        key: "repos",
        label: "Repos (comma-separated)",
        type: "string",
        required: true,
      },
    ],
    run: async ({ values }) =>
      workspaceService.define(
        requiredText(values, "name"),
        requiredText(values, "repos")
          .split(",")
          .map((r: string) => r.trim())
          .filter(Boolean),
      ),
  },
  {
    workspace: "Workspaces",
    id: "workspace.list",
    title: "List Workspaces",
    command: "gitfleet workspace list",
    description: "List all defined workspaces.",
    inputs: [],
    run: async () => workspaceService.list(),
  },
];

export default workspaceOperations;
