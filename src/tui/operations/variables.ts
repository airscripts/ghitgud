import type { TuiOperation } from "../types";
import { text, requiredText } from "./shared";
import variablesService from "@/services/variables";

const variableOperations: TuiOperation[] = [
  {
    id: "variable.list",
    workspace: "Variables",
    title: "List Variables",
    command: "ghg variable list",
    description: "List repository, environment, or organization variables.",

    inputs: [
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: ({ values }) =>
      variablesService.list({
        env: text(values, "env"),
        org: text(values, "org"),
      }),
  },

  {
    mutates: true,
    id: "variable.set",
    title: "Set Variable",
    workspace: "Variables",
    description: "Create or update a variable.",
    command: "ghg variable set --name <key> --value <val>",

    inputs: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "value", label: "Value", type: "string", required: true },
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: ({ values }) =>
      variablesService.set({
        env: text(values, "env"),
        org: text(values, "org"),
        name: requiredText(values, "name"),
        value: requiredText(values, "value"),
      }),
  },

  {
    mutates: true,
    id: "variable.delete",
    workspace: "Variables",
    title: "Delete Variable",
    description: "Delete a variable.",
    command: "ghg variable delete --name <key>",

    inputs: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: ({ values }) =>
      variablesService.remove({
        env: text(values, "env"),
        org: text(values, "org"),
        name: requiredText(values, "name"),
      }),
  },
];

export default variableOperations;
