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
    id: "dev.list",
    title: "List Development Environments",
    command: "gitfleet dev list",
    description: "List hosted development environments.",
    inputs: [],
    run: async () => codespaceService.list(),
  },
  {
    workspace: "Codespaces",
    id: "dev.view",
    title: "View Development Environment",
    command: "gitfleet dev view <id>",
    description: "View development environment details.",
    inputs: [
      { key: "id", label: "Environment ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      codespaceService.view(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Codespaces",
    id: "dev.create",
    title: "Create Development Environment",
    command: "gitfleet dev create --repo <repo>",
    description: "Create a hosted development environment.",
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
    id: "dev.start",
    title: "Start Development Environment",
    command: "gitfleet dev start <id>",
    description: "Start a stopped development environment.",
    inputs: [
      { key: "id", label: "Environment ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      codespaceService.start(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Codespaces",
    id: "dev.stop",
    title: "Stop Development Environment",
    command: "gitfleet dev stop <id>",
    description: "Stop a running development environment.",
    inputs: [
      { key: "id", label: "Environment ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      codespaceService.stop(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Codespaces",
    id: "dev.delete",
    title: "Delete Development Environment",
    command: "gitfleet dev delete <id> --yes",
    description: "Delete a development environment.",
    inputs: [
      { key: "id", label: "Environment ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      codespaceService.delete(requiredText(values, "id"), { yes: true }),
  },
];

export default codespaceOperations;
