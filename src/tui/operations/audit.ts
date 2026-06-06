import type { TuiOperation } from "../types";
import auditService from "@/services/audit";
import { text, numberValue } from "./shared";

const auditOperations: TuiOperation[] = [
  {
    id: "audit.list",
    title: "Audit Log",
    command: "ghg audit",
    workspace: "Security",
    description: "Query organization or enterprise audit logs.",
    inputs: [
      { key: "org", label: "Organization", type: "string" },
      { key: "enterprise", label: "Enterprise", type: "string" },
      { key: "actor", label: "Actor", type: "string" },
      { key: "action", label: "Action", type: "string" },
      { key: "repo", label: "Repository", type: "string" },
      { key: "after", label: "After date", type: "string" },
      { key: "before", label: "Before date", type: "string" },
      { key: "limit", label: "Limit", type: "number" },

      {
        key: "order",
        label: "Order",
        type: "string",
        defaultValue: "desc",
      },
    ],

    run: ({ values }) =>
      auditService.list({
        org: text(values, "org"),
        repo: text(values, "repo"),
        actor: text(values, "actor"),
        after: text(values, "after"),
        order: text(values, "order"),
        action: text(values, "action"),
        before: text(values, "before"),
        enterprise: text(values, "enterprise"),
        limit: text(values, "limit") ? numberValue(values, "limit") : undefined,
      }),
  },
];

export default auditOperations;
