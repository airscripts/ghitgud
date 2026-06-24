import type { TuiOperation } from "../types";
import discussionService from "@/services/discussion";

import {
  text,
  repoInput,
  inferRepo,
  numberValue,
  requiredText,
} from "./shared";

const discussionOperations: TuiOperation[] = [
  {
    id: "discussion.list",
    workspace: "Discussions",
    title: "List Discussions",
    command: "ghg discussion list",
    description: "List discussions with optional category filter.",
    inputs: [
      repoInput,
      { key: "category", label: "Category", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],
    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return discussionService.list(repo, {
        category: text(values, "category"),
        limit: Number(values.limit) || undefined,
      });
    },
  },

  {
    id: "discussion.view",
    workspace: "Discussions",
    title: "View Discussion",
    command: "ghg discussion view <number>",
    description: "View a discussion and its comments.",

    inputs: [
      repoInput,
      {
        key: "number",
        type: "number",
        required: true,
        label: "Discussion",
      },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return discussionService.view(repo, numberValue(values, "number"));
    },
  },

  {
    mutates: true,
    id: "discussion.create",
    workspace: "Discussions",
    title: "Create Discussion",
    description: "Create a new discussion.",
    command: "ghg discussion create --title <title> --category <category>",

    inputs: [
      repoInput,
      { key: "title", label: "Title", type: "string", required: true },
      { key: "category", label: "Category", type: "string", required: true },
      { key: "body", label: "Body", type: "string" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return discussionService.create(repo, {
        body: text(values, "body"),
        title: requiredText(values, "title"),
        category: requiredText(values, "category"),
      });
    },
  },

  {
    mutates: true,
    title: "Add Comment",
    workspace: "Discussions",
    id: "discussion.comment",
    description: "Add a comment to a discussion.",
    command: "ghg discussion comment <number> --body <body>",

    inputs: [
      repoInput,
      {
        key: "number",
        label: "Discussion",
        type: "number",
        required: true,
      },
      { key: "body", label: "Body", type: "string", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return discussionService.comment(
        repo,
        String(numberValue(values, "number")),
        requiredText(values, "body"),
      );
    },
  },

  {
    mutates: true,
    id: "discussion.close",
    workspace: "Discussions",
    title: "Close Discussion",
    description: "Close a discussion.",
    command: "ghg discussion close <number>",

    inputs: [
      repoInput,
      {
        key: "number",
        type: "number",
        required: true,
        label: "Discussion",
      },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return discussionService.close(
        repo,
        String(numberValue(values, "number")),
      );
    },
  },

  {
    workspace: "Discussions",
    title: "List Categories",
    id: "discussion.categories",
    command: "ghg discussion categories",
    description: "List available discussion categories.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return discussionService.categories(repo);
    },
  },
];

export default discussionOperations;
