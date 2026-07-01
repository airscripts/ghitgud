import type { TuiOperation } from "../types";
import apiService from "@/services/api";
import { text, booleanValue, requiredText } from "./shared";

const apiOperations: TuiOperation[] = [
  {
    id: "api.request",
    workspace: "API",
    title: "provider API Request",
    command: "gitfleet api <endpoint>",
    description: "Make an authenticated provider API request.",
    inputs: [
      { key: "endpoint", label: "Endpoint", type: "string", required: true },
      { key: "method", label: "Method", type: "string" },
      { key: "fields", label: "Fields (one per line)", type: "string" },
      { key: "paginate", label: "Paginate", type: "boolean" },
      { key: "jq", label: "jq filter", type: "string" },
    ],
    run: ({ values }) =>
      apiService.request(requiredText(values, "endpoint"), {
        method: text(values, "method"),
        fields: text(values, "fields")
          ?.split("\n")
          .map((field) => field.trim())
          .filter(Boolean),
        paginate: booleanValue(values, "paginate"),
        jq: text(values, "jq"),
      }),
  },
];

export default apiOperations;
