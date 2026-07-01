import type { TuiOperation } from "../types";
import costService from "@/services/cost";
import { text, numberValue, repoInput, inferRepo } from "./shared";

const actionsOperations: TuiOperation[] = [
  {
    workspace: "Actions",
    id: "actions.usage",
    title: "Actions Usage",
    command: "gitfleet actions usage",
    description: "Show Actions usage for a repository.",
    inputs: [repoInput],
    run: async ({ values }) =>
      costService.usage({ repo: text(values, "repo") || (await inferRepo()) }),
  },
  {
    workspace: "Actions",
    id: "actions.cost",
    title: "Actions Cost",
    command: "gitfleet actions cost",
    description: "Show Actions cost breakdown.",
    inputs: [repoInput, { key: "org", label: "Organization", type: "string" }],
    run: async ({ values }) =>
      costService.cost({
        org: text(values, "org"),
        repo: text(values, "repo"),
      }),
  },
  {
    workspace: "Actions",
    id: "actions.top-spenders",
    title: "Top Spenders",
    command: "gitfleet actions top-spenders",
    description: "Show top workflows by cost.",
    inputs: [
      repoInput,
      { key: "limit", label: "Limit", type: "number", defaultValue: 10 },
    ],
    run: async ({ values }) =>
      costService.topSpenders({
        repo: text(values, "repo") || (await inferRepo()),
        limit: numberValue(values, "limit"),
      }),
  },
];

export default actionsOperations;
