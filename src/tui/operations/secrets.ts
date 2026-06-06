import type { TuiOperation } from "../types";
import { text, requiredText } from "./shared";
import secretsService from "@/services/secrets";

const secretOperations: TuiOperation[] = [
  {
    id: "secret.list",
    workspace: "Secrets",
    title: "List Secrets",
    command: "ghg secret list",
    description: "List repository, environment, or organization secrets.",

    inputs: [
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: ({ values }) =>
      secretsService.list({
        env: text(values, "env"),
        org: text(values, "org"),
      }),
  },

  {
    mutates: true,
    id: "secret.set",
    title: "Set Secret",
    workspace: "Secrets",
    command: "ghg secret set --name <key> --value <val>",
    description: "Create or update an encrypted secret.",

    inputs: [
      { key: "name", label: "Name", type: "string", required: true },

      {
        key: "value",
        secret: true,
        label: "Value",
        type: "string",
        required: true,
      },

      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },

      {
        type: "string",
        required: false,
        key: "visibility",
        label: "Visibility",
        placeholder: "all, private, selected",
      },

      {
        key: "repos",
        type: "string",
        required: false,
        label: "Selected Repos",
      },
    ],

    run: ({ values }) =>
      secretsService.set({
        env: text(values, "env"),
        org: text(values, "org"),
        repos: text(values, "repos"),
        name: requiredText(values, "name"),
        value: requiredText(values, "value"),
        visibility: text(values, "visibility"),
      }),
  },

  {
    mutates: true,
    id: "secret.delete",
    workspace: "Secrets",
    title: "Delete Secret",
    description: "Delete a secret.",
    command: "ghg secret delete --name <key>",

    inputs: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: ({ values }) =>
      secretsService.remove({
        env: text(values, "env"),
        org: text(values, "org"),
        name: requiredText(values, "name"),
      }),
  },
];

export default secretOperations;
