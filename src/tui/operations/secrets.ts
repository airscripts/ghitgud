import type { TuiOperation } from "../types";
import secretsService from "@/services/secrets";
import { text, requiredText, repoInput, inferRepoOptional } from "./shared";

const secretOperations: TuiOperation[] = [
  {
    id: "secret.list",
    workspace: "Secrets",
    title: "List Secrets",
    command: "ghg secret list",
    description: "List repository, environment, or organization secrets.",

    inputs: [
      repoInput,
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());

      return secretsService.list({
        repo,
        env: text(values, "env"),
        org: text(values, "org"),
      });
    },
  },

  {
    mutates: true,
    id: "secret.set",
    title: "Set Secret",
    workspace: "Secrets",
    command: "ghg secret set --name <key> --value <val>",
    description: "Create or update an encrypted secret.",

    inputs: [
      repoInput,
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

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());

      return secretsService.set({
        repo,
        env: text(values, "env"),
        org: text(values, "org"),
        repos: text(values, "repos"),
        name: requiredText(values, "name"),
        value: requiredText(values, "value"),
        visibility: text(values, "visibility"),
      });
    },
  },

  {
    mutates: true,
    id: "secret.delete",
    workspace: "Secrets",
    title: "Delete Secret",
    description: "Delete a secret.",
    command: "ghg secret delete --name <key>",

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },
      { key: "env", label: "Environment", type: "string", required: false },
      { key: "org", label: "Organization", type: "string", required: false },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());

      return secretsService.remove({
        repo,
        env: text(values, "env"),
        org: text(values, "org"),
        name: requiredText(values, "name"),
      });
    },
  },
];

export default secretOperations;
