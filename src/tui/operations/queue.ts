import type { TuiOperation } from "../types";
import queueService from "@/services/queue";
import { text, inferRepo, repoInput, numberValue } from "./shared";

const queueOperations: TuiOperation[] = [
  ...["list", "status"].map(
    (action): TuiOperation => ({
      id: `queue.${action}`,
      workspace: "Queue",
      title: `${action === "list" ? "List" : "Merge Queue"} ${action === "list" ? "Queue Entries" : "Status"}`,
      command: `ghg queue ${action}`,
      description: `${action === "list" ? "List" : "Inspect"} the merge queue.`,
      inputs: [repoInput, { key: "branch", label: "Branch", type: "string" }],
      run: async ({ values }) =>
        queueService[action as "list"](
          text(values, "repo") || (await inferRepo()),
          { branch: text(values, "branch") },
        ),
    }),
  ),
  ...["add", "remove"].map(
    (action): TuiOperation => ({
      id: `queue.${action}`,
      workspace: "Queue",
      title: `${action === "add" ? "Add to" : "Remove from"} Merge Queue`,
      command: `ghg queue ${action} <pr>`,
      description: `${action === "add" ? "Add" : "Remove"} a pull request ${action === "add" ? "to" : "from"} the queue.`,
      mutates: true,
      inputs: [
        repoInput,
        { key: "pr", label: "Pull request", type: "number", required: true },
      ],
      run: async ({ values }) =>
        queueService[action as "add"](
          text(values, "repo") || (await inferRepo()),
          numberValue(values, "pr"),
        ),
    }),
  ),
  {
    id: "queue.history",
    workspace: "Queue",
    title: "Merge Queue History",
    command: "ghg queue history",
    description: "Show recent merge queue activity.",
    inputs: [
      repoInput,
      { key: "branch", label: "Branch", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 20 },
    ],
    run: async ({ values }) =>
      queueService.history(text(values, "repo") || (await inferRepo()), {
        branch: text(values, "branch"),
        limit: numberValue(values, "limit"),
      }),
  },
];

export default queueOperations;
