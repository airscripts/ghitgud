import { text } from "./shared";
import type { TuiOperation } from "../types";
import labelsService from "@/services/labels";

const labelOperations: TuiOperation[] = [
  {
    id: "labels.list",
    workspace: "Labels",
    title: "List Labels",
    command: "ghg labels list",
    description: "List repository labels.",
    run: () => labelsService.list(),
  },

  {
    mutates: true,
    id: "labels.pull",
    workspace: "Labels",
    title: "Pull Labels",
    command: "ghg labels pull",
    description: "Save repository labels to local metadata.",
    inputs: [{ key: "template", label: "Template", type: "string" }],

    run: ({ values }) => {
      const template = text(values, "template");

      return template
        ? labelsService.pullTemplate(template, "templates")
        : labelsService.pull();
    },
  },

  {
    mutates: true,
    id: "labels.push",
    workspace: "Labels",
    title: "Push Labels",
    command: "ghg labels push",
    description: "Sync local or template labels to the repository.",
    inputs: [{ key: "template", label: "Template", type: "string" }],

    run: ({ values }) => {
      const template = text(values, "template");

      return template
        ? labelsService.pushTemplate(template, "templates")
        : labelsService.push();
    },
  },

  {
    mutates: true,
    id: "labels.prune",
    workspace: "Labels",
    title: "Prune Labels",
    command: "ghg labels prune",
    description: "Delete labels listed in local metadata.",
    run: () => labelsService.prune(),
  },
];

export default labelOperations;
