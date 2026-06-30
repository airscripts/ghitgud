import type { TuiOperation } from "../types";
import extensionService from "@/services/extension";
import { requiredText } from "./shared";

const extensionOperations: TuiOperation[] = [
  {
    workspace: "Extensions",
    id: "extension.list",
    title: "List Extensions",
    command: "ghg extension list",
    description: "List installed extensions.",
    inputs: [],
    run: async () => extensionService.list(),
  },
  {
    mutates: true,
    workspace: "Extensions",
    id: "extension.install",
    title: "Install Extension",
    command: "ghg extension install <repo>",
    description: "Install an extension from a git repository.",
    inputs: [
      {
        key: "repo",
        label: "Repository URL",
        type: "string",
        required: true,
      },
    ],
    run: async ({ values }) =>
      extensionService.install(requiredText(values, "repo")),
  },
  {
    mutates: true,
    workspace: "Extensions",
    id: "extension.remove",
    title: "Remove Extension",
    command: "ghg extension remove <name> --yes",
    description: "Remove an installed extension.",
    inputs: [
      { key: "name", label: "Extension name", type: "string", required: true },
    ],
    run: async ({ values }) =>
      extensionService.remove(requiredText(values, "name")),
  },
  {
    mutates: true,
    workspace: "Extensions",
    id: "extension.upgrade",
    title: "Upgrade Extension",
    command: "ghg extension upgrade <name>",
    description: "Upgrade an installed extension.",
    inputs: [
      { key: "name", label: "Extension name", type: "string", required: true },
    ],
    run: async ({ values }) =>
      extensionService.upgrade(requiredText(values, "name")),
  },
  {
    mutates: true,
    workspace: "Extensions",
    id: "extension.create",
    title: "Create Extension",
    command: "ghg extension create <name>",
    description: "Scaffold a new extension project.",
    inputs: [
      {
        key: "name",
        label: "Extension name (must start with ghg-)",
        type: "string",
        required: true,
      },
    ],
    run: async ({ values }) =>
      extensionService.create(requiredText(values, "name")),
  },
  {
    workspace: "Extensions",
    id: "extension.exec",
    title: "Run Extension",
    command: "ghg extension exec <name> [args...]",
    description: "Run an installed extension.",
    inputs: [
      { key: "name", label: "Extension name", type: "string", required: true },
      { key: "args", label: "Arguments (space-separated)", type: "string" },
    ],
    run: async ({ values }) => {
      const rawArgs = values.args;
      const args =
        typeof rawArgs === "string" ? rawArgs.split(" ").filter(Boolean) : [];
      return extensionService.exec(requiredText(values, "name"), args);
    },
  },
];

export default extensionOperations;
