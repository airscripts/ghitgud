import type { TuiOperation } from "../types";
import { text, numberValue } from "./shared";
import projectService from "@/services/project";

const projectOperations: TuiOperation[] = [
  {
    id: "project.board",
    workspace: "Projects",
    title: "Project Board",
    command: "ghg project board <id>",
    description: "Render a GitHub Projects v2 kanban board.",

    inputs: [
      { key: "id", label: "Project number", type: "number", required: true },
      { key: "owner", label: "Owner", type: "string" },
    ],

    run: ({ values }) =>
      projectService.board(String(numberValue(values, "id")), {
        owner: text(values, "owner"),
      }),
  },
];

export default projectOperations;
