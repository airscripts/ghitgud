import { requiredText } from "./shared";
import type { TuiOperation } from "../types";
import configService from "@/services/config";

const configOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "config.set",
    title: "Set Config",
    workspace: "Config",
    description: "Set a config value.",
    command: "gitfleet config set <key> <value>",

    inputs: [
      { key: "key", label: "Key", type: "string", required: true },
      {
        key: "value",
        secret: true,
        label: "Value",
        type: "string",
        required: true,
      },
    ],

    run: ({ values }) =>
      configService.set(
        requiredText(values, "key"),
        requiredText(values, "value"),
      ),
  },

  {
    id: "config.get",
    title: "Get Config",
    workspace: "Config",
    command: "gitfleet config get <key>",
    description: "Read a config value.",
    inputs: [{ key: "key", label: "Key", type: "string", required: true }],
    run: ({ values }) => configService.get(requiredText(values, "key")),
  },

  {
    mutates: true,
    id: "config.unset",
    workspace: "Config",
    title: "Unset Config",
    command: "gitfleet config unset <key>",
    description: "Remove a config value.",
    inputs: [{ key: "key", label: "Key", type: "string", required: true }],
    run: ({ values }) => configService.unset(requiredText(values, "key")),
  },
];

export default configOperations;
