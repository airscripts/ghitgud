import type { TuiOperation } from "../types";
import depsService from "@/services/deps";
import { text, repoInput, inferRepo } from "./shared";

const depsOperations: TuiOperation[] = [
  {
    workspace: "Dependencies",
    id: "deps.list",
    title: "List Dependencies",
    command: "gitfleet deps list",
    description: "List dependencies for a repository.",
    inputs: [repoInput],
    run: async ({ values }) =>
      depsService.list({ repo: text(values, "repo") || (await inferRepo()) }),
  },
  {
    workspace: "Dependencies",
    id: "deps.direct",
    title: "List Direct Dependencies",
    command: "gitfleet deps direct",
    description: "List direct dependencies only.",
    inputs: [repoInput],
    run: async ({ values }) =>
      depsService.direct({ repo: text(values, "repo") || (await inferRepo()) }),
  },
  {
    workspace: "Dependencies",
    id: "deps.review",
    title: "Review Dependency Changes",
    command: "gitfleet deps review --base <ref> --head <ref>",
    description: "Compare dependencies between two refs.",
    inputs: [
      repoInput,
      { key: "base", label: "Base ref", type: "string", required: true },
      { key: "head", label: "Head ref", type: "string", required: true },
    ],
    run: async ({ values }) =>
      depsService.review({
        repo: text(values, "repo") || (await inferRepo()),
        base: text(values, "base") ?? "",
        head: text(values, "head") ?? "",
      }),
  },
];

export default depsOperations;
