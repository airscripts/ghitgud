import type { TuiOperation } from "../types";
const utilityOperations: TuiOperation[] = [
  {
    id: "version",
    title: "Version",
    command: "gitfleet version",
    workspace: "Utility",
    description: "Show the current version.",
    run: () => ({ success: true, version: __VERSION__ }),
  },
];

export default utilityOperations;
