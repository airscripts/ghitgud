import licenseService from "@/services/licenses";

import type { TuiOperation } from "../types";
import { requiredText } from "./shared";

const licenseOperations: TuiOperation[] = [
  {
    workspace: "Licenses",
    id: "license.list",
    title: "List Licenses",
    command: "gitfleet license list",
    description: "List available open-source licenses.",
    run: () => licenseService.list(),
  },
  {
    workspace: "Licenses",
    id: "license.view",
    title: "View License",
    command: "gitfleet license view <key>",
    description: "View a license template.",
    inputs: [
      {
        key: "key",
        label: "License key",
        type: "string",
        required: true,
      },
    ],
    run: ({ values }) => licenseService.view(requiredText(values, "key")),
  },
];

export default licenseOperations;
