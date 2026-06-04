import type { TuiOperation } from "../types";
import discussionService from "@/services/discussion";
import { text, numberValue, requiredText } from "./shared";

const discussionOperations: TuiOperation[] = [
  {
    id: "discussion.list",
    workspace: "Discussions",
    title: "List Discussions",
    command: "ghg discussion list",
    description: "List discussions with optional category filter.",
    inputs: [
      { key: "category", label: "Category", type: "string" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 30 },
    ],
    run: ({ values }) =>
      discussionService.list({
        category: text(values, "category"),
        limit: Number(values.limit) || undefined,
      }),
  },

  {
    id: "discussion.view",
    workspace: "Discussions",
    title: "View Discussion",
    command: "ghg discussion view <number>",
    description: "View a discussion and its comments.",
    inputs: [
      {
        key: "number",
        type: "number",
        required: true,
        label: "Discussion",
      },
    ],
    run: ({ values }) =>
      discussionService.view(String(numberValue(values, "number"))),
  },

  {
    mutates: true,
    id: "discussion.create",
    workspace: "Discussions",
    title: "Create Discussion",
    description: "Create a new discussion.",
    command: "ghg discussion create --title <title> --category <category>",

    inputs: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "category", label: "Category", type: "string", required: true },
      { key: "body", label: "Body", type: "string" },
    ],
    run: ({ values }) =>
      discussionService.create({
        body: text(values, "body"),
        title: requiredText(values, "title"),
        category: requiredText(values, "category"),
      }),
  },

  {
    mutates: true,
    title: "Add Comment",
    workspace: "Discussions",
    id: "discussion.comment",
    description: "Add a comment to a discussion.",
    command: "ghg discussion comment <number> --body <body>",

    inputs: [
      {
        key: "number",
        label: "Discussion",
        type: "number",
        required: true,
      },
      { key: "body", label: "Body", type: "string", required: true },
    ],
    run: ({ values }) =>
      discussionService.comment(
        String(numberValue(values, "number")),
        requiredText(values, "body"),
      ),
  },

  {
    mutates: true,
    id: "discussion.close",
    workspace: "Discussions",
    title: "Close Discussion",
    description: "Close a discussion.",
    command: "ghg discussion close <number>",

    inputs: [
      {
        key: "number",
        type: "number",
        required: true,
        label: "Discussion",
      },
    ],
    run: ({ values }) =>
      discussionService.close(String(numberValue(values, "number"))),
  },

  {
    workspace: "Discussions",
    title: "List Categories",
    id: "discussion.categories",
    command: "ghg discussion categories",
    description: "List available discussion categories.",
    run: () => discussionService.categories(),
  },
];

export default discussionOperations;
