import type { TuiOperation } from "../types";
import leaksService from "@/services/leaks";
import { text, numberValue, targetInputs, targetOptions } from "./shared";

const leaksOperations: TuiOperation[] = [
  {
    id: "leaks.scan",
    workspace: "Security",
    title: "Scan for Leaks",
    command: "ghg leaks scan",
    description: "Run a local read-only scan for likely leaked secrets.",

    inputs: [
      {
        key: "limit",
        label: "Limit",
        type: "number",
      },
    ],

    run: ({ values }) =>
      leaksService.scan({
        limit: text(values, "limit") ? numberValue(values, "limit") : undefined,
      }),
  },

  {
    id: "leaks.alerts",
    workspace: "Security",
    command: "ghg leaks alerts",
    title: "Secret Scanning Alerts",
    description: "List GitHub secret scanning alerts.",

    inputs: [
      ...targetInputs,
      { key: "state", label: "State", type: "string" },
      { key: "secretType", label: "Secret type", type: "string" },
      { key: "resolution", label: "Resolution", type: "string" },
      { key: "after", label: "After date", type: "string" },
      { key: "before", label: "Before date", type: "string" },
    ],

    run: ({ values }) =>
      leaksService.alerts({
        ...targetOptions(values),
        state: text(values, "state"),
        after: text(values, "after"),
        before: text(values, "before"),
        resolution: text(values, "resolution"),
        secretType: text(values, "secretType"),
      }),
  },
];

export default leaksOperations;
