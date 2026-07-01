import type { TuiOperation } from "../types";
import statusService from "@/services/status";
import { text } from "./shared";

const statusOperations: TuiOperation[] = [
  {
    id: "status.overview",
    workspace: "Status",
    title: "Cross-Repository Status",
    command: "gitfleet status",
    description: "Show your work across provider repositories.",
    inputs: [
      { key: "org", label: "Organization", type: "string" },
      { key: "exclude", label: "Exclude repositories", type: "string" },
    ],
    run: ({ values }) =>
      statusService.status({
        org: text(values, "org"),
        exclude: text(values, "exclude")
          ?.split(",")
          .map((repo) => repo.trim())
          .filter(Boolean),
      }),
  },
];

export default statusOperations;
