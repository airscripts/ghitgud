import type { TuiOperation } from "../types";
import dependabotService from "@/services/dependabot";
import {
  text,
  booleanValue,
  targetInputs,
  targetOptions,
  requiredText,
  numberValue,
} from "./shared";

const dependabotOperations: TuiOperation[] = [
  {
    id: "dependabot.list",
    workspace: "Security",
    command: "ghg dependabot list",
    title: "List Dependabot Alerts",
    description: "Inspect Dependabot alerts across repositories.",

    inputs: [
      ...targetInputs,
      { key: "state", label: "State", type: "string" },
      { key: "severity", label: "Severity", type: "string" },
      { key: "ecosystem", label: "Ecosystem", type: "string" },
      { key: "package", label: "Package", type: "string" },
      { key: "scope", label: "Scope", type: "string" },
      { key: "after", label: "After date", type: "string" },
      { key: "before", label: "Before date", type: "string" },
    ],

    run: ({ values }) =>
      dependabotService.list({
        ...targetOptions(values),
        state: text(values, "state"),
        scope: text(values, "scope"),
        after: text(values, "after"),
        before: text(values, "before"),
        package: text(values, "package"),
        severity: text(values, "severity"),
        ecosystem: text(values, "ecosystem"),
      }),
  },

  {
    mutates: true,
    id: "dependabot.dismiss",
    workspace: "Security",
    title: "Dismiss Dependabot Alert",
    command: "ghg dependabot dismiss <alert>",
    description: "Dismiss a Dependabot alert with a reason.",

    inputs: [
      { key: "alert", label: "Alert number", type: "number", required: true },
      { key: "repo", label: "Repository", type: "string" },
      { key: "reason", label: "Reason", type: "string", required: true },
      { key: "comment", label: "Comment", type: "string" },
      { key: "yes", label: "Confirm", type: "boolean" },
    ],

    run: ({ values }) =>
      dependabotService.dismiss(numberValue(values, "alert"), {
        repo: text(values, "repo"),
        comment: text(values, "comment"),
        yes: booleanValue(values, "yes"),
        reason: requiredText(values, "reason"),
      }),
  },
];

export default dependabotOperations;
