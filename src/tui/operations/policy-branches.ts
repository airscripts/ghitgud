import type { TuiOperation } from "../types";
import branchService from "@/services/branch";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
} from "./shared";

const branchOperations: TuiOperation[] = [
  {
    workspace: "Branches",
    id: "branch.protect",
    title: "Protect Branch",
    command: "gitfleet branch protect <pattern>",
    description: "Protect a branch pattern.",
    mutates: true,
    inputs: [
      repoInput,
      {
        key: "branch",
        label: "Branch pattern",
        type: "string",
        required: true,
      },
      {
        key: "requiredReviews",
        label: "Required reviews",
        type: "number",
        defaultValue: 1,
      },
      { key: "dismissStale", label: "Dismiss stale", type: "boolean" },
    ],
    run: async ({ values }) =>
      branchService.protect({
        repo: text(values, "repo") || (await inferRepo()),
        branch: requiredText(values, "branch"),
        requiredReviews: numberValue(values, "requiredReviews"),
        dismissStale: values.dismissStale === true,
      }),
  },
  {
    mutates: true,
    workspace: "Branches",
    id: "branch.unprotect",
    title: "Unprotect Branch",
    command: "gitfleet branch unprotect <pattern>",
    description: "Remove branch protection.",
    inputs: [
      repoInput,
      {
        key: "branch",
        label: "Branch pattern",
        type: "string",
        required: true,
      },
    ],
    run: async ({ values }) =>
      branchService.unprotect({
        repo: text(values, "repo") || (await inferRepo()),
        branch: requiredText(values, "branch"),
      }),
  },
  {
    workspace: "Branches",
    id: "branch.protection.list",
    title: "List Protection Rules",
    command: "gitfleet branch protection",
    description: "List branch and tag protection rules.",
    inputs: [repoInput],
    run: async ({ values }) =>
      branchService.listProtection({
        repo: text(values, "repo") || (await inferRepo()),
      }),
  },
  {
    mutates: true,
    workspace: "Branches",
    id: "branch.tag-protect",
    title: "Tag Protect",
    command: "gitfleet branch tag-protect <pattern>",
    description: "Create a tag protection rule.",
    inputs: [
      repoInput,
      {
        key: "pattern",
        label: "Tag pattern",
        type: "string",
        required: true,
      },
    ],
    run: async ({ values }) =>
      branchService.tagProtect({
        repo: text(values, "repo") || (await inferRepo()),
        pattern: requiredText(values, "pattern"),
      }),
  },
  {
    mutates: true,
    workspace: "Branches",
    id: "branch.tag-unprotect",
    title: "Tag Unprotect",
    command: "gitfleet branch tag-unprotect <pattern>",
    description: "Remove a tag protection rule.",
    inputs: [
      repoInput,
      {
        key: "pattern",
        label: "Tag pattern",
        type: "string",
        required: true,
      },
    ],
    run: async ({ values }) =>
      branchService.tagUnprotect({
        repo: text(values, "repo") || (await inferRepo()),
        pattern: requiredText(values, "pattern"),
      }),
  },
];

export default branchOperations;
