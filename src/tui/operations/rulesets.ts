import type { TuiOperation } from "../types";
import rulesetService from "@/services/ruleset";
import {
  text,
  inferRepo,
  repoInput,
  numberValue,
  requiredText,
} from "./shared";

const target = async (values: Record<string, string | number | boolean>) => {
  const org = text(values, "org");
  return org ? { org } : { repo: text(values, "repo") || (await inferRepo()) };
};

const targetInputs = [
  repoInput,
  { key: "org", label: "Organization", type: "string" } as const,
];

const rulesetOperations: TuiOperation[] = [
  {
    id: "ruleset.list",
    workspace: "Rulesets",
    title: "List Rulesets",
    command: "ghg ruleset list",
    description: "List repository or organization rulesets.",
    inputs: targetInputs,
    run: async ({ values }) => rulesetService.list(await target(values)),
  },
  {
    id: "ruleset.view",
    workspace: "Rulesets",
    title: "View Ruleset",
    command: "ghg ruleset view <id>",
    description: "View a ruleset.",
    inputs: [
      ...targetInputs,
      { key: "id", label: "Ruleset ID", type: "number", required: true },
    ],
    run: async ({ values }) =>
      rulesetService.view(numberValue(values, "id"), await target(values)),
  },
  {
    id: "ruleset.check",
    workspace: "Rulesets",
    title: "Check Branch Rules",
    command: "ghg ruleset check <branch>",
    description: "Check effective rules for a branch.",
    inputs: [
      repoInput,
      { key: "branch", label: "Branch", type: "string", required: true },
    ],
    run: async ({ values }) =>
      rulesetService.check(
        text(values, "repo") || (await inferRepo()),
        requiredText(values, "branch"),
      ),
  },
  ...["create", "edit"].map(
    (action): TuiOperation => ({
      id: `ruleset.${action}`,
      workspace: "Rulesets",
      title: `${action === "create" ? "Create" : "Edit"} Ruleset`,
      command: `ghg ruleset ${action}`,
      description: `${action === "create" ? "Create" : "Edit"} a ruleset from a file.`,
      mutates: true,
      inputs: [
        ...targetInputs,
        ...(action === "edit"
          ? ([
              {
                key: "id",
                label: "Ruleset ID",
                type: "number",
                required: true,
              },
            ] as const)
          : []),
        {
          key: "file",
          label: "Definition file",
          type: "string",
          required: true,
        },
      ],
      run: async ({ values }) =>
        action === "create"
          ? rulesetService.create(
              requiredText(values, "file"),
              await target(values),
            )
          : rulesetService.edit(
              numberValue(values, "id"),
              requiredText(values, "file"),
              await target(values),
            ),
    }),
  ),
  {
    id: "ruleset.delete",
    workspace: "Rulesets",
    title: "Delete Ruleset",
    command: "ghg ruleset delete <id>",
    description: "Delete a ruleset.",
    mutates: true,
    inputs: [
      ...targetInputs,
      { key: "id", label: "Ruleset ID", type: "number", required: true },
    ],
    run: async ({ values }) =>
      rulesetService.remove(numberValue(values, "id"), await target(values)),
  },
  {
    id: "ruleset.validate",
    workspace: "Rulesets",
    title: "Validate Ruleset",
    command: "ghg ruleset validate",
    description: "Validate a ruleset definition.",
    inputs: [
      { key: "file", label: "Definition file", type: "string", required: true },
    ],
    run: ({ values }) => rulesetService.validate(requiredText(values, "file")),
  },
];

export default rulesetOperations;
