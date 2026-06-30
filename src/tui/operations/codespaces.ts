import type { TuiOperation } from "../types";
import codespaceService from "@/services/codespace";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
} from "./shared";

const codespaceOperations: TuiOperation[] = [
  {
    workspace: "Codespaces",
    id: "codespace.list",
    title: "List Codespaces",
    command: "ghg codespace list",
    description: "List your codespaces.",
    inputs: [],
    run: async () => codespaceService.list(),
  },
  {
    workspace: "Codespaces",
    id: "codespace.view",
    title: "View Codespace",
    command: "ghg codespace view <id>",
    description: "View codespace details.",
    inputs: [
      { key: "id", label: "Codespace ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      codespaceService.view(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Codespaces",
    id: "codespace.create",
    title: "Create Codespace",
    command: "ghg codespace create --repo <repo>",
    description: "Create a codespace.",
    inputs: [
      repoInput,
      { key: "ref", label: "Branch/ref", type: "string" },
      { key: "machine", label: "Machine type", type: "string" },
      { key: "idleTimeout", label: "Idle timeout (min)", type: "number" },
    ],
    run: async ({ values }) =>
      codespaceService.create({
        repo: text(values, "repo") || (await inferRepo()),
        ref: text(values, "ref"),
        machine: text(values, "machine"),
        idleTimeout: numberValue(values, "idleTimeout") || undefined,
      }),
  },
  {
    mutates: true,
    workspace: "Codespaces",
    id: "codespace.start",
    title: "Start Codespace",
    command: "ghg codespace start <id>",
    description: "Start a stopped codespace.",
    inputs: [
      { key: "id", label: "Codespace ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      codespaceService.start(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Codespaces",
    id: "codespace.stop",
    title: "Stop Codespace",
    command: "ghg codespace stop <id>",
    description: "Stop a running codespace.",
    inputs: [
      { key: "id", label: "Codespace ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      codespaceService.stop(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Codespaces",
    id: "codespace.delete",
    title: "Delete Codespace",
    command: "ghg codespace delete <id> --yes",
    description: "Delete a codespace.",
    inputs: [
      { key: "id", label: "Codespace ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      codespaceService.delete(requiredText(values, "id"), { yes: true }),
  },
];

export default codespaceOperations;
