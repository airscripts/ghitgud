import type { TuiOperation } from "../types";
import advisoryService from "@/services/advisory";
import { text } from "./shared";

const advisoryOperations: TuiOperation[] = [
  {
    workspace: "Advisories",
    id: "advisory.list",
    title: "List Advisories",
    command: "ghg advisory list",
    description: "List security advisories from the GitHub Advisory Database.",
    inputs: [
      { key: "ecosystem", label: "Ecosystem", type: "string" },
      { key: "severity", label: "Severity", type: "string" },
    ],
    run: async ({ values }) =>
      advisoryService.list({
        ecosystem: text(values, "ecosystem"),
        severity: text(values, "severity"),
      }),
  },
  {
    workspace: "Advisories",
    id: "advisory.view",
    title: "View Advisory",
    command: "ghg advisory view <ghsa-id>",
    description: "View a specific security advisory.",
    inputs: [
      { key: "ghsaId", label: "GHSA ID", type: "string", required: true },
    ],
    run: async ({ values }) =>
      advisoryService.view(text(values, "ghsaId") ?? ""),
  },
];

export default advisoryOperations;
