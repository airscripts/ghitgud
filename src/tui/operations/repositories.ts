import type { TuiOperation } from "../types";
import reposLabelService from "@/services/repos/label";
import reposGovernService from "@/services/repos/govern";
import reposRetireService from "@/services/repos/retire";
import reposReportService from "@/services/repos/report";
import reposInspectService from "@/services/repos/inspect";
import { targetInputs, text, booleanValue, targetOptions } from "./shared";

const repositoryOperations: TuiOperation[] = [
  {
    id: "repos.inspect",
    inputs: targetInputs,
    workspace: "Repositories",
    command: "ghg repos inspect",
    title: "Inspect Repositories",
    description: "Inspect repository governance files.",
    run: ({ values }) => reposInspectService.inspect(targetOptions(values)),
  },

  {
    mutates: true,
    id: "repos.govern",
    dryRunDefault: true,
    workspace: "Repositories",
    command: "ghg repos govern",
    title: "Govern Repositories",
    description: "Apply repository rulesets.",

    inputs: [
      ...targetInputs,
      { key: "ruleset", label: "Ruleset path", type: "string" },
      { key: "dryRun", label: "Dry run", type: "boolean", defaultValue: true },
      { key: "yes", label: "Apply", type: "boolean" },
    ],

    run: ({ values }) =>
      reposGovernService.govern({
        ...targetOptions(values),
        ruleset: text(values, "ruleset"),
        yes: booleanValue(values, "yes"),
        dryRun: booleanValue(values, "dryRun"),
      }),
  },

  {
    mutates: true,
    id: "repos.label",
    dryRunDefault: true,
    workspace: "Repositories",
    command: "ghg repos label",
    title: "Label Repositories",
    description: "Sync labels across repository targets.",

    inputs: [
      ...targetInputs,
      { key: "template", label: "Template", type: "string" },
      { key: "metadata", label: "Metadata path", type: "string" },
      { key: "dryRun", label: "Dry run", type: "boolean", defaultValue: true },
      { key: "yes", label: "Apply", type: "boolean" },
    ],

    run: ({ values }) =>
      reposLabelService.label({
        ...targetOptions(values),
        yes: booleanValue(values, "yes"),
        template: text(values, "template"),
        metadata: text(values, "metadata"),
        dryRun: booleanValue(values, "dryRun"),
      }),
  },

  {
    mutates: true,
    id: "repos.retire",
    dryRunDefault: true,
    workspace: "Repositories",
    command: "ghg repos retire",
    title: "Retire Repositories",
    description: "Find and optionally archive inactive repositories.",

    inputs: [
      ...targetInputs,
      {
        key: "months",
        type: "number",
        defaultValue: 12,
        label: "Inactive months",
      },
      { key: "includeForks", label: "Include forks", type: "boolean" },
      { key: "includePrivate", label: "Include private", type: "boolean" },
      { key: "dryRun", label: "Dry run", type: "boolean", defaultValue: true },
      { key: "yes", label: "Apply", type: "boolean" },
    ],

    run: ({ values }) =>
      reposRetireService.retire({
        ...targetOptions(values),
        months: text(values, "months"),
        yes: booleanValue(values, "yes"),
        dryRun: booleanValue(values, "dryRun"),
        includeForks: booleanValue(values, "includeForks"),
        includePrivate: booleanValue(values, "includePrivate"),
      }),
  },

  {
    id: "repos.report",
    workspace: "Repositories",
    title: "Repository Report",
    command: "ghg repos report",
    description: "Report repository health and velocity.",
    inputs: [...targetInputs, { key: "since", label: "Since", type: "string" }],

    run: ({ values }) =>
      reposReportService.report({
        ...targetOptions(values),
        since: text(values, "since"),
      }),
  },
];

export default repositoryOperations;
