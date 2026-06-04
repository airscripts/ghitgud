import type { TuiOperation } from "../types";
import { text, requiredText } from "./shared";
import milestoneService from "@/services/milestone";

const milestoneOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "milestone.create",
    workspace: "Milestones",
    title: "Create Milestone",
    command: "ghg milestone create",
    description: "Create a repository milestone with a due date.",

    inputs: [
      { key: "title", label: "Title", type: "string", required: true },

      {
        key: "due",
        type: "string",
        label: "Due date",
        required: true,
        placeholder: "2026-06-30",
      },
    ],

    run: ({ values }) =>
      milestoneService.create({
        due: requiredText(values, "due"),
        title: requiredText(values, "title"),
      }),
  },

  {
    id: "milestone.list",
    workspace: "Milestones",
    title: "List Milestones",
    command: "ghg milestone list",
    description: "List open or closed repository milestones.",

    inputs: [
      {
        key: "status",
        type: "string",
        label: "Status",
        defaultValue: "open",
        placeholder: "open or closed",
      },
    ],

    run: ({ values }) =>
      milestoneService.list({
        status: (text(values, "status") ?? "open") as "open" | "closed",
      }),
  },

  {
    mutates: true,
    id: "milestone.close",
    workspace: "Milestones",
    title: "Close Milestone",
    command: "ghg milestone close <name>",
    description: "Close a milestone by exact title.",
    inputs: [{ key: "name", label: "Name", type: "string", required: true }],
    run: ({ values }) => milestoneService.close(requiredText(values, "name")),
  },

  {
    workspace: "Milestones",
    id: "milestone.progress",
    title: "Milestone Progress",
    command: "ghg milestone progress <name>",
    description: "Show milestone completion percentage.",
    inputs: [{ key: "name", label: "Name", type: "string", required: true }],

    run: ({ values }) =>
      milestoneService.progress(requiredText(values, "name")),
  },
];

export default milestoneOperations;
