import prService from "@/services/pr";
import stackService from "@/services/stack";
import type { TuiOperation } from "../types";

import {
  text,
  repoInput,
  inferRepo,
  numberValue,
  booleanValue,
} from "./shared";

const prOperations: TuiOperation[] = [
  {
    mutates: true,
    id: "pr.cleanup",
    workspace: "PRs",
    dryRunDefault: true,
    command: "ghg pr cleanup",
    title: "Clean Merged PR Branches",
    description: "Delete merged local/remote branches and fast-forward base.",

    inputs: [
      repoInput,
      { key: "dryRun", label: "Dry run", type: "boolean", defaultValue: true },
      { key: "force", label: "Force", type: "boolean" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return prService.cleanup(repo, {
        dryRun: booleanValue(values, "dryRun"),
        force: booleanValue(values, "force"),
      });
    },
  },

  {
    id: "pr.push",
    mutates: true,
    workspace: "PRs",
    title: "Push to PR Fork",
    command: "ghg pr push <number>",
    description: "Push current branch to a contributor fork.",

    inputs: [
      repoInput,
      { key: "pr", label: "PR number", type: "number", required: true },
      { key: "force", label: "Force", type: "boolean" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return prService.push(
        numberValue(values, "pr"),
        repo,
        booleanValue(values, "force"),
      );
    },
  },

  {
    id: "pr.next",
    mutates: true,
    workspace: "PRs",
    title: "Stack Next",
    command: "ghg pr next",
    description: "Move through a tracked PR stack.",

    inputs: [
      { key: "reverse", label: "Reverse", type: "boolean" },
      { key: "list", label: "List only", type: "boolean" },
    ],

    run: ({ values }) =>
      stackService.next({
        list: booleanValue(values, "list"),
        reverse: booleanValue(values, "reverse"),
      }),
  },

  {
    mutates: true,
    workspace: "PRs",
    id: "pr.stack.create",
    title: "Create Stack",
    command: "ghg pr stack create",
    description: "Create a stack from the current branch.",

    inputs: [
      {
        key: "base",
        type: "string",
        label: "Base branch",
        defaultValue: "auto",
      },
    ],

    run: ({ values }) => stackService.create({ base: text(values, "base") }),
  },

  {
    workspace: "PRs",
    id: "pr.stack.list",
    title: "List Stack",
    command: "ghg pr stack list",
    description: "Show current stack status.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return stackService.list(repo);
    },
  },

  {
    mutates: true,
    workspace: "PRs",
    id: "pr.stack.update",
    title: "Update Stack",
    command: "ghg pr stack update",
    description: "Update an existing stack after parent PR merges.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return stackService.update(repo);
    },
  },

  {
    mutates: true,
    workspace: "PRs",
    id: "pr.stack.push",
    title: "Push Stack",
    command: "ghg pr stack push",
    description: "Push a stack and create/update PRs.",

    inputs: [
      repoInput,
      {
        key: "title",
        type: "string",
        label: "Title template",
        defaultValue: "feat: {branch}",
      },
      { key: "draft", label: "Draft", type: "boolean" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return stackService.push(repo, {
        title: text(values, "title"),
        draft: booleanValue(values, "draft"),
      });
    },
  },
];

export default prOperations;
