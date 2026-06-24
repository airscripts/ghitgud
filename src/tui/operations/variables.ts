import type { TuiOperation } from "../types";
import variablesService from "@/services/variables";
import { text, requiredText, repoInput, inferRepoOptional } from "./shared";

const variableOperations: TuiOperation[] = [
  {
    id: "variable.list",
    workspace: "Variables",
    title: "List Variables",
    command: "ghg variable list",
    description: "List repository, environment, or organization variables.",

    inputs: [
      repoInput,
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());

      return variablesService.list({
        repo,
        env: text(values, "env"),
        org: text(values, "org"),
      });
    },
  },

  {
    mutates: true,
    id: "variable.set",
    title: "Set Variable",
    workspace: "Variables",
    description: "Create or update a variable.",
    command: "ghg variable set --name <key> --value <val>",

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },
      { key: "value", label: "Value", type: "string", required: true },
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());

      return variablesService.set({
        repo,
        env: text(values, "env"),
        org: text(values, "org"),
        name: requiredText(values, "name"),
        value: requiredText(values, "value"),
      });
    },
  },

  {
    mutates: true,
    id: "variable.delete",
    workspace: "Variables",
    title: "Delete Variable",
    description: "Delete a variable.",
    command: "ghg variable delete --name <key>",

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());

      return variablesService.remove({
        repo,
        env: text(values, "env"),
        org: text(values, "org"),
        name: requiredText(values, "name"),
      });
    },
  },
];

export default variableOperations;
