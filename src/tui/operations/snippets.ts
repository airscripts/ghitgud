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
    id: "snippet.list",
    title: "List Snippets",
    command: "gitfleet snippet list",
    description: "List your snippets or the public feed.",
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
    id: "snippet.view",
    title: "View Snippet",
    command: "gitfleet snippet view <id>",
    description: "View snippet metadata and files.",
    inputs: [
      { key: "id", label: "Snippet ID", type: "string", required: true },
    ],
    run: ({ values }) => gistService.view(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Gists",
    id: "snippet.create",
    title: "Create Snippet",
    command: "gitfleet snippet create <files...>",
    description: "Create a snippet from local files.",
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
    id: "snippet.edit",
    title: "Edit Snippet",
    command: "gitfleet snippet edit <id>",
    description: "Add, update, or remove snippet files.",
    inputs: [
      { key: "id", label: "Snippet ID", type: "string", required: true },
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
    id: "snippet.delete",
    title: "Delete Snippet",
    command: "gitfleet snippet delete <id>",
    description: "Delete a snippet.",
    inputs: [
      { key: "id", label: "Snippet ID", type: "string", required: true },
    ],
    run: ({ values }) => gistService.remove(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Gists",
    id: "snippet.clone",
    title: "Clone Snippet",
    command: "gitfleet snippet clone <id>",
    description: "Clone a snippet repository.",
    inputs: [
      { key: "id", label: "Snippet ID", type: "string", required: true },
      { key: "directory", label: "Destination", type: "string" },
    ],
    run: ({ values }) =>
      gistService.clone(requiredText(values, "id"), text(values, "directory")),
  },
  {
    workspace: "Gists",
    id: "snippet.fork",
    title: "Fork Snippet",
    command: "gitfleet snippet fork <id>",
    description: "Fork a snippet.",
    mutates: true,
    inputs: [
      { key: "id", label: "Snippet ID", type: "string", required: true },
    ],
    run: async ({ values }) => gistService.fork(requiredText(values, "id")),
  },
  {
    workspace: "Gists",
    id: "snippet.star",
    title: "Star Snippet",
    command: "gitfleet snippet star <id>",
    description: "Star a snippet.",
    mutates: true,
    inputs: [
      { key: "id", label: "Snippet ID", type: "string", required: true },
    ],
    run: async ({ values }) => gistService.star(requiredText(values, "id")),
  },
  {
    workspace: "Gists",
    id: "snippet.unstar",
    title: "Unstar Snippet",
    command: "gitfleet snippet unstar <id>",
    description: "Unstar a snippet.",
    mutates: true,
    inputs: [
      { key: "id", label: "Snippet ID", type: "string", required: true },
    ],
    run: async ({ values }) => gistService.unstar(requiredText(values, "id")),
  },
  {
    mutates: true,
    workspace: "Gists",
    id: "snippet.comment",
    title: "Comment on Snippet",
    command: "gitfleet snippet comment <id> --body <text>",
    description: "Add a comment to a snippet.",
    inputs: [
      { key: "id", label: "Snippet ID", type: "string", required: true },
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
