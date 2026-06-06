import type { TuiOperation } from "../types";
import { GhitgudError } from "@/core/errors";
import { requiredText, numberValue } from "./shared";
import environmentsService from "@/services/environments";

const environmentOperations: TuiOperation[] = [
  {
    id: "environment.list",
    workspace: "Environments",
    title: "List Environments",
    command: "ghg environment list",
    description: "List configured environments.",
    inputs: [],
    run: () => environmentsService.list(),
  },

  {
    mutates: true,
    id: "environment.create",
    workspace: "Environments",
    title: "Create Environment",
    command: "ghg environment create --name <name>",
    description: "Create an environment with optional wait timer.",

    inputs: [
      { key: "name", label: "Name", type: "string", required: true },

      {
        key: "waitTimer",
        label: "Wait Timer (seconds)",
        type: "number",
        required: false,
      },
    ],

    run: ({ values }) =>
      environmentsService.create({
        name: requiredText(values, "name"),

        waitTimer: values.waitTimer
          ? numberValue(values, "waitTimer")
          : undefined,
      }),
  },

  {
    workspace: "Environments",
    title: "List Protection Rules",
    id: "environment.protection.list",
    command: "ghg environment protection list --env <name>",
    description: "List protection rules for an environment.",

    inputs: [
      { key: "env", label: "Environment", type: "string", required: true },
    ],

    run: ({ values }) =>
      environmentsService.listProtectionRules(requiredText(values, "env")),
  },

  {
    mutates: true,
    workspace: "Environments",
    title: "Add Protection Rule",
    id: "environment.protection.add",
    description: "Add a protection rule to an environment.",
    command: "ghg environment protection add --env <name> --type <type>",

    inputs: [
      { key: "env", label: "Environment", type: "string", required: true },

      {
        key: "type",
        label: "Rule Type",
        type: "string",
        required: true,
        placeholder: "required_reviewers, branch_policy, wait_timer",
      },

      { key: "value", label: "Value (JSON)", type: "string", required: true },
    ],

    run: ({ values }) => {
      let parsed: Record<string, unknown>;

      try {
        parsed = JSON.parse(requiredText(values, "value"));
      } catch {
        throw new GhitgudError("Invalid JSON value.");
      }

      return environmentsService.addProtectionRule({
        env: requiredText(values, "env"),
        type: requiredText(values, "type") as
          | "required_reviewers"
          | "branch_policy"
          | "wait_timer",
        value: parsed,
      });
    },
  },

  {
    mutates: true,
    workspace: "Environments",
    title: "Remove Protection Rule",
    id: "environment.protection.remove",
    description: "Remove a protection rule from an environment.",
    command: "ghg environment protection remove --env <name> --rule-id <id>",

    inputs: [
      { key: "env", label: "Environment", type: "string", required: true },
      { key: "ruleId", label: "Rule ID", type: "number", required: true },
    ],

    run: ({ values }) =>
      environmentsService.removeProtectionRule({
        env: requiredText(values, "env"),
        ruleId: numberValue(values, "ruleId"),
      }),
  },
];

export default environmentOperations;
