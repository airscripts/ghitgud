import type { TuiOperation } from "../types";
import syncService from "@/services/sync";
import { text } from "./shared";

const syncOperations: TuiOperation[] = [
  {
    workspace: "Workspaces",
    id: "repo.syncall",
    title: "Sync All Repos",
    command: "gitfleet repo syncall",
    description: "Pull latest changes for all local repositories.",
    mutates: true,
    inputs: [{ key: "root", label: "Root directory", type: "string" }],
    run: async ({ values }) =>
      syncService.syncall({ root: text(values, "root") }),
  },
  {
    workspace: "Workspaces",
    id: "repo.statusall",
    title: "Status All Repos",
    command: "gitfleet repo statusall",
    description: "Check status across multiple local repositories.",
    inputs: [{ key: "root", label: "Root directory", type: "string" }],
    run: async ({ values }) =>
      syncService.statusall({ root: text(values, "root") }),
  },
];

export default syncOperations;
