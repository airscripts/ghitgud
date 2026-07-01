import type { TuiOperation } from "../types";
import templateService from "@/services/template";
import { text, repoInput, inferRepo, requiredText } from "./shared";

const templateOperations: TuiOperation[] = [
  {
    workspace: "Templates",
    id: "template.list",
    title: "List Templates",
    command: "gitfleet template list",
    description: "List available issue and change templates.",
    inputs: [repoInput],
    run: async ({ values }) =>
      templateService.list({
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    workspace: "Templates",
    id: "template.show",
    title: "Show Template",
    command: "gitfleet template show <name>",
    description: "Preview a specific template.",
    inputs: [
      { key: "name", label: "Template name", type: "string", required: true },
      repoInput,
    ],
    run: async ({ values }) =>
      templateService.show(requiredText(values, "name"), {
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
];

export default templateOperations;
