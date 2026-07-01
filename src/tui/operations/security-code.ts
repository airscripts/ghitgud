import type { TuiOperation } from "../types";
import codeqlService from "@/services/codeql";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
} from "./shared";

const codeqlOperations: TuiOperation[] = [
  {
    workspace: "CodeQL",
    id: "codeql.list",
    title: "List CodeQL Alerts",
    command: "gitfleet codeql list",
    description: "List CodeQL code scanning alerts.",
    inputs: [
      repoInput,
      { key: "state", label: "State", type: "string" },
      { key: "severity", label: "Severity", type: "string" },
    ],
    run: async ({ values }) =>
      codeqlService.list({
        repo: text(values, "repo") || (await inferRepo()),
        state: text(values, "state"),
        severity: text(values, "severity"),
      }),
  },
  {
    workspace: "CodeQL",
    id: "codeql.view",
    title: "View CodeQL Alert",
    command: "gitfleet codeql view <number>",
    description: "View a CodeQL alert.",
    inputs: [
      repoInput,
      {
        key: "alertNumber",
        label: "Alert number",
        type: "number",
        required: true,
      },
    ],
    run: async ({ values }) =>
      codeqlService.view({
        repo: text(values, "repo") || (await inferRepo()),
        alertNumber: numberValue(values, "alertNumber"),
      }),
  },
  {
    mutates: true,
    workspace: "CodeQL",
    id: "codeql.dismiss",
    title: "Dismiss CodeQL Alert",
    command: "gitfleet codeql dismiss <number> --reason <reason>",
    description: "Dismiss a CodeQL alert.",
    inputs: [
      repoInput,
      {
        key: "alertNumber",
        label: "Alert number",
        type: "number",
        required: true,
      },
      {
        key: "reason",
        label: "Reason (false positive, won't fix, used in tests)",
        type: "string",
        required: true,
      },
    ],
    run: async ({ values }) =>
      codeqlService.dismiss({
        repo: text(values, "repo") || (await inferRepo()),
        alertNumber: numberValue(values, "alertNumber"),
        reason: requiredText(values, "reason"),
      }),
  },
];

export default codeqlOperations;
