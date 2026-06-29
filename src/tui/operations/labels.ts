import labelsService from "@/services/labels";
import type { TuiOperation } from "../types";
import { text, requiredText, repoInput, inferRepo } from "./shared";

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
    id: "labels.add",
    title: "Add Label",
    workspace: "Labels",
    command: "ghg labels add <name>",
    description: "Create a new label.",

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },

      {
        key: "color",
        label: "Color (hex)",
        type: "string",
        defaultValue: "ededed",
      },

      { key: "description", label: "Description", type: "string" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return labelsService.create(
        requiredText(values, "name"),
        {
          color: text(values, "color"),
          description: text(values, "description"),
        },
        repo,
      );
    },
  },

  {
    id: "labels.get",
    workspace: "Labels",
    title: "Get Label",
    command: "ghg labels get <name>",
    description: "View details for a label.",

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return labelsService.get(requiredText(values, "name"), repo);
    },
  },

  {
    id: "labels.edit",
    workspace: "Labels",
    title: "Edit Label",
    command: "ghg labels edit <name>",
    description: "Update a label.",
    mutates: true,

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },
      { key: "newName", label: "New name", type: "string" },
      { key: "color", label: "Color (hex)", type: "string" },
      { key: "description", label: "Description", type: "string" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return labelsService.update(
        requiredText(values, "name"),
        {
          newName: text(values, "newName"),
          color: text(values, "color"),
          description: text(values, "description"),
        },
        repo,
      );
    },
  },

  {
    mutates: true,
    id: "labels.remove",
    workspace: "Labels",
    title: "Remove Label",
    command: "ghg labels remove <name>",
    description: "Delete a label.",

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return labelsService.deleteLabel(requiredText(values, "name"), repo, {
        yes: true,
      });
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
    id: "labels.clone",
    workspace: "Labels",
    title: "Clone Labels",
    command: "ghg labels clone --source <repo>",
    description: "Clone labels from one repository to another.",

    inputs: [
      {
        key: "source",
        type: "string",
        required: true,
        label: "Source repo",
        placeholder: "owner/source",
      },
      repoInput,
    ],

    run: async ({ values }) => {
      const target = text(values, "repo") || (await inferRepo());
      return labelsService.clone(requiredText(values, "source"), target);
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
