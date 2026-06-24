import type { TuiOperation } from "../types";
import labelsService from "@/services/labels";
import { text, repoInput, inferRepo } from "./shared";

const labelOperations: TuiOperation[] = [
  {
    id: "labels.list",
    workspace: "Labels",
    title: "List Labels",
    command: "ghg labels list",
    description: "List repository labels.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return labelsService.list(repo);
    },
  },

  {
    mutates: true,
    id: "labels.pull",
    workspace: "Labels",
    title: "Pull Labels",
    command: "ghg labels pull",
    description: "Save repository labels to local metadata.",
    inputs: [repoInput, { key: "template", label: "Template", type: "string" }],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      const template = text(values, "template");

      return template
        ? labelsService.pullTemplate(template, "templates")
        : labelsService.pull(repo);
    },
  },

  {
    mutates: true,
    id: "labels.push",
    workspace: "Labels",
    title: "Push Labels",
    command: "ghg labels push",
    description: "Sync local or template labels to the repository.",
    inputs: [repoInput, { key: "template", label: "Template", type: "string" }],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      const template = text(values, "template");

      return template
        ? labelsService.pushTemplate(template, "templates", repo)
        : labelsService.push(repo);
    },
  },

  {
    mutates: true,
    id: "labels.prune",
    workspace: "Labels",
    title: "Prune Labels",
    command: "ghg labels prune",
    description: "Delete labels listed in local metadata.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return labelsService.prune(repo);
    },
  },
];

export default labelOperations;
