import type { TuiOperation } from "../types";
import milestoneService from "@/services/milestone";
import { text, requiredText, repoInput, inferRepo } from "./shared";

const milestoneOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "milestone.create",
    workspace: "Milestones",
    title: "Create Milestone",
    command: "gitfleet milestone create",
    description: "Create a repository milestone with a due date.",

    inputs: [
      repoInput,
      { key: "title", label: "Title", type: "string", required: true },

      {
        key: "due",
        type: "string",
        label: "Due date",
        required: true,
        placeholder: "2026-06-30",
      },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return milestoneService.create(repo, {
        due: requiredText(values, "due"),
        title: requiredText(values, "title"),
      });
    },
  },

  {
    id: "milestone.list",
    workspace: "Milestones",
    title: "List Milestones",
    command: "gitfleet milestone list",
    description: "List open or closed repository milestones.",

    inputs: [
      repoInput,
      {
        key: "status",
        type: "string",
        label: "Status",
        defaultValue: "open",
        placeholder: "open or closed",
      },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return milestoneService.list(repo, {
        status: (text(values, "status") ?? "open") as "open" | "closed",
      });
    },
  },

  {
    mutates: true,
    id: "milestone.close",
    workspace: "Milestones",
    title: "Close Milestone",
    command: "gitfleet milestone close <name>",
    description: "Close a milestone by exact title.",

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return milestoneService.close(repo, requiredText(values, "name"));
    },
  },

  {
    workspace: "Milestones",
    id: "milestone.progress",
    title: "Milestone Progress",
    command: "gitfleet milestone progress <name>",
    description: "Show milestone completion percentage.",

    inputs: [
      repoInput,
      { key: "name", label: "Name", type: "string", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return milestoneService.progress(repo, requiredText(values, "name"));
    },
  },
];

export default milestoneOperations;
