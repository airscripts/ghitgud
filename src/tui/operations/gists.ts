import type { TuiOperation } from "../types";
import gistService from "@/services/gist";
import { text, numberValue, booleanValue, requiredText } from "./shared";

const lines = (value?: string): string[] | undefined =>
  value
    ?.split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

const gistOperations: TuiOperation[] = [
  {
    workspace: "Gists",
    id: "gist.list",
    title: "List Gists",
    command: "ghg gist list",
    description: "List your gists or the public feed.",
    inputs: [
      { key: "public", label: "Public feed", type: "boolean" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],
    run: ({ values }) =>
      gistService.list({
        public: booleanValue(values, "public"),
        limit: numberValue(values, "limit"),
      }),
  },
  {
    workspace: "Gists",
    id: "gist.view",
    title: "View Gist",
    command: "ghg gist view <id>",
    description: "View gist metadata and files.",
    inputs: [{ key: "id", label: "Gist ID", type: "string", required: true }],
    run: ({ values }) => gistService.view(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Gists",
    id: "gist.create",
    title: "Create Gist",
    command: "ghg gist create <files...>",
    description: "Create a gist from local files.",
    inputs: [
      {
        key: "files",
        label: "Files (one per line)",
        type: "string",
        required: true,
      },
      { key: "description", label: "Description", type: "string" },
      { key: "public", label: "Public", type: "boolean" },
    ],
    run: ({ values }) =>
      gistService.create(lines(requiredText(values, "files")) ?? [], {
        description: text(values, "description"),
        public: booleanValue(values, "public"),
      }),
  },
  {
    mutates: true,
    workspace: "Gists",
    id: "gist.edit",
    title: "Edit Gist",
    command: "ghg gist edit <id>",
    description: "Add, update, or remove gist files.",
    inputs: [
      { key: "id", label: "Gist ID", type: "string", required: true },
      { key: "add", label: "Local files (one per line)", type: "string" },
      { key: "remove", label: "Remove names (one per line)", type: "string" },
    ],
    run: ({ values }) =>
      gistService.edit(requiredText(values, "id"), {
        add: lines(text(values, "add")),
        remove: lines(text(values, "remove")),
      }),
  },
  {
    mutates: true,
    workspace: "Gists",
    id: "gist.delete",
    title: "Delete Gist",
    command: "ghg gist delete <id>",
    description: "Delete a gist.",
    inputs: [{ key: "id", label: "Gist ID", type: "string", required: true }],
    run: ({ values }) => gistService.remove(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Gists",
    id: "gist.clone",
    title: "Clone Gist",
    command: "ghg gist clone <id>",
    description: "Clone a gist repository.",
    inputs: [
      { key: "id", label: "Gist ID", type: "string", required: true },
      { key: "directory", label: "Destination", type: "string" },
    ],
    run: ({ values }) =>
      gistService.clone(requiredText(values, "id"), text(values, "directory")),
  },
  {
    workspace: "Gists",
    id: "gist.fork",
    title: "Fork Gist",
    command: "ghg gist fork <id>",
    description: "Fork a gist.",
    mutates: true,
    inputs: [{ key: "id", label: "Gist ID", type: "string", required: true }],
    run: async ({ values }) => gistService.fork(requiredText(values, "id")),
  },
  {
    workspace: "Gists",
    id: "gist.star",
    title: "Star Gist",
    command: "ghg gist star <id>",
    description: "Star a gist.",
    mutates: true,
    inputs: [{ key: "id", label: "Gist ID", type: "string", required: true }],
    run: async ({ values }) => gistService.star(requiredText(values, "id")),
  },
  {
    workspace: "Gists",
    id: "gist.unstar",
    title: "Unstar Gist",
    command: "ghg gist unstar <id>",
    description: "Unstar a gist.",
    mutates: true,
    inputs: [{ key: "id", label: "Gist ID", type: "string", required: true }],
    run: async ({ values }) => gistService.unstar(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Gists",
    id: "gist.comment",
    title: "Comment on Gist",
    command: "ghg gist comment <id> --body <text>",
    description: "Add a comment to a gist.",
    inputs: [
      { key: "id", label: "Gist ID", type: "string", required: true },
      { key: "body", label: "Comment body", type: "string", required: true },
    ],
    run: async ({ values }) =>
      gistService.comment(
        requiredText(values, "id"),
        requiredText(values, "body"),
      ),
  },
];

export default gistOperations;
