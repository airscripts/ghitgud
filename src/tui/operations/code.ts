import type { TuiOperation } from "../types";
import codeService from "@/services/code";
import { text, repoInput, inferRepo, requiredText } from "./shared";

const codeOperations: TuiOperation[] = [
  {
    workspace: "Code Navigation",
    id: "code.search",
    title: "Search Code",
    command: "gitfleet code search <query>",
    description: "Search code across repositories.",
    inputs: [
      { key: "query", label: "Search query", type: "string", required: true },
      repoInput,
      { key: "language", label: "Language", type: "string" },
    ],
    run: async ({ values }) =>
      codeService.search(requiredText(values, "query"), {
        repo: text(values, "repo") || (await inferRepo()),
        language: text(values, "language"),
      }),
  },
  {
    workspace: "Code Navigation",
    id: "code.definitions",
    title: "Find Definitions",
    command: "gitfleet code definitions <symbol>",
    description: "Find symbol definitions.",
    inputs: [
      { key: "symbol", label: "Symbol", type: "string", required: true },
      repoInput,
    ],
    run: async ({ values }) =>
      codeService.definitions(requiredText(values, "symbol"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    workspace: "Code Navigation",
    id: "code.references",
    title: "Find References",
    command: "gitfleet code references <symbol>",
    description: "Find symbol references.",
    inputs: [
      { key: "symbol", label: "Symbol", type: "string", required: true },
      repoInput,
    ],
    run: async ({ values }) =>
      codeService.references(requiredText(values, "symbol"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    workspace: "Code Navigation",
    id: "code.file",
    title: "View File",
    command: "gitfleet code file <path>",
    description: "View a file at a specific ref.",
    inputs: [
      { key: "path", label: "File path", type: "string", required: true },
      repoInput,
      { key: "ref", label: "Git ref", type: "string" },
    ],
    run: async ({ values }) =>
      codeService.file(requiredText(values, "path"), {
        repo: text(values, "repo") || (await inferRepo()),
        ref: text(values, "ref"),
      }),
  },
  {
    workspace: "Code Navigation",
    id: "code.blame",
    title: "Blame with PR Context",
    command: "gitfleet code blame <path>",
    description: "Enhanced blame with PR context.",
    inputs: [
      { key: "path", label: "File path", type: "string", required: true },
      repoInput,
    ],
    run: async ({ values }) =>
      codeService.blame(requiredText(values, "path"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
];

export default codeOperations;
