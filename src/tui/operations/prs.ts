import prService from "@/services/pr";
import stackService from "@/services/stack";
import type { TuiOperation } from "../types";

import {
  text,
  repoInput,
  inferRepo,
  numberValue,
  booleanValue,
  requiredText,
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

  {
    mutates: true,
    id: "pr.create",
    workspace: "PRs",
    title: "Create Pull Request",
    command: "ghg pr create",
    description: "Create a pull request from a branch.",

    inputs: [
      repoInput,
      { key: "title", label: "Title", type: "string", required: true },
      { key: "body", label: "Body", type: "string" },
      { key: "base", label: "Base branch", type: "string" },
      { key: "head", label: "Head branch", type: "string" },
      { key: "draft", label: "Draft", type: "boolean" },
    ],

    run: async ({ values }) =>
      prService.create(text(values, "repo") || (await inferRepo()), {
        title: requiredText(values, "title"),
        body: text(values, "body"),
        base: text(values, "base"),
        head: text(values, "head"),
        draft: booleanValue(values, "draft"),
      }),
  },

  {
    id: "pr.list",
    workspace: "PRs",
    title: "List Pull Requests",
    command: "ghg pr list",
    description: "List filtered pull requests.",

    inputs: [
      repoInput,
      { key: "state", label: "State", type: "string", defaultValue: "open" },
      { key: "base", label: "Base branch", type: "string" },
      { key: "head", label: "Head branch", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 10 },
    ],

    run: async ({ values }) =>
      prService.list(text(values, "repo") || (await inferRepo()), {
        state: (text(values, "state") ?? "open") as
          | "open"
          | "closed"
          | "merged"
          | "all",
        base: text(values, "base"),
        head: text(values, "head"),
        limit: numberValue(values, "limit"),
      }),
  },

  {
    id: "pr.view",
    workspace: "PRs",
    title: "View Pull Request",
    command: "ghg pr view <number>",
    description: "View pull request details.",

    inputs: [
      repoInput,
      { key: "pr", label: "PR number", type: "number", required: true },
    ],

    run: async ({ values }) =>
      prService.view(
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "pr"),
      ),
  },

  {
    mutates: true,
    id: "pr.edit",
    workspace: "PRs",
    title: "Edit Pull Request",
    command: "ghg pr edit <number>",
    description: "Edit pull request metadata.",

    inputs: [
      repoInput,
      { key: "pr", label: "PR number", type: "number", required: true },
      { key: "title", label: "Title", type: "string" },
      { key: "body", label: "Body", type: "string" },
      { key: "base", label: "Base branch", type: "string" },
      { key: "removeBody", label: "Remove body", type: "boolean" },
    ],

    run: async ({ values }) =>
      prService.edit(
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "pr"),
        {
          title: text(values, "title"),
          body: text(values, "body"),
          base: text(values, "base"),
          removeBody: booleanValue(values, "removeBody"),
        },
      ),
  },

  ...(
    [
      "close",
      "reopen",
      "checkout",
      "diff",
      "checks",
      "lock",
      "unlock",
      "ready",
    ] as const
  ).map(
    (action): TuiOperation => ({
      mutates: [
        "close",
        "reopen",
        "checkout",
        "lock",
        "unlock",
        "ready",
      ].includes(action),
      id: `pr.${action}`,
      workspace: "PRs",
      title: `${action[0].toUpperCase()}${action.slice(1)} Pull Request`,
      command: `ghg pr ${action} <number>`,
      description: `${action[0].toUpperCase()}${action.slice(1)} a pull request.`,

      inputs: [
        repoInput,
        { key: "pr", label: "PR number", type: "number", required: true },
      ],

      run: async ({ values }) =>
        prService[action](
          text(values, "repo") || (await inferRepo()),
          numberValue(values, "pr"),
        ),
    }),
  ),
  {
    mutates: true,
    id: "pr.merge",
    workspace: "PRs",
    title: "Merge Pull Request",
    command: "ghg pr merge <number>",
    description: "Merge a pull request.",

    inputs: [
      repoInput,
      { key: "pr", label: "PR number", type: "number", required: true },

      {
        key: "method",
        label: "Method",
        type: "string",
        placeholder: "merge, squash, or rebase",
      },

      { key: "deleteBranch", label: "Delete remote branch", type: "boolean" },
    ],

    run: async ({ values }) =>
      prService.merge(
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "pr"),
        {
          method: text(values, "method") as
            | "merge"
            | "squash"
            | "rebase"
            | undefined,
          deleteBranch: booleanValue(values, "deleteBranch"),
        },
      ),
  },
  {
    mutates: true,
    id: "pr.comment",
    workspace: "PRs",
    title: "Comment on Pull Request",
    command: "ghg pr comment <number>",
    description: "Add a pull request comment.",

    inputs: [
      repoInput,
      { key: "pr", label: "PR number", type: "number", required: true },
      { key: "body", label: "Body", type: "string", required: true },
    ],

    run: async ({ values }) =>
      prService.comment(
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "pr"),
        requiredText(values, "body"),
      ),
  },
  {
    id: "pr.status",
    workspace: "PRs",
    command: "ghg pr status",
    title: "Pull Request Status",
    description: "Show created and review-requested pull requests.",
    inputs: [repoInput],
    run: async ({ values }) => prService.status(text(values, "repo")),
  },
];

export default prOperations;
