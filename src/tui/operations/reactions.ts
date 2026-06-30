import type { TuiOperation } from "../types";
import reactionService from "@/services/reaction";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
} from "./shared";

const reactionOperations: TuiOperation[] = [
  {
    workspace: "Reactions",
    id: "react.list",
    title: "List Reactions",
    command: "ghg react list",
    description: "List reactions on an issue, comment, or review comment.",
    inputs: [
      repoInput,
      { key: "issue", label: "Issue/PR number", type: "number" },
      { key: "comment", label: "Comment ID", type: "number" },
      { key: "reviewComment", label: "Review comment ID", type: "number" },
    ],
    run: async ({ values }) =>
      reactionService.list({
        repo: text(values, "repo") || (await inferRepo()),
        issue: numberValue(values, "issue") || undefined,
        comment: numberValue(values, "comment") || undefined,
        reviewComment: numberValue(values, "reviewComment") || undefined,
      }),
  },
  {
    mutates: true,
    workspace: "Reactions",
    id: "react.add",
    title: "Add Reaction",
    command: "ghg react add --emoji <emoji>",
    description: "Add an emoji reaction.",
    inputs: [
      repoInput,
      { key: "issue", label: "Issue/PR number", type: "number" },
      { key: "comment", label: "Comment ID", type: "number" },
      { key: "reviewComment", label: "Review comment ID", type: "number" },
      {
        key: "emoji",
        label: "Emoji (+1, -1, laugh, confused, heart, hooray, rocket, eyes)",
        type: "string",
        required: true,
      },
    ],
    run: async ({ values }) =>
      reactionService.add({
        repo: text(values, "repo") || (await inferRepo()),
        issue: numberValue(values, "issue") || undefined,
        comment: numberValue(values, "comment") || undefined,
        reviewComment: numberValue(values, "reviewComment") || undefined,
        emoji: requiredText(values, "emoji"),
      }),
  },
  {
    mutates: true,
    workspace: "Reactions",
    id: "react.remove",
    title: "Remove Reaction",
    command: "ghg react remove <reactionId>",
    description: "Remove a reaction.",
    inputs: [
      repoInput,
      {
        key: "reactionId",
        label: "Reaction ID",
        type: "number",
        required: true,
      },
      { key: "issue", label: "Issue/PR number", type: "number" },
      { key: "comment", label: "Comment ID", type: "number" },
      { key: "reviewComment", label: "Review comment ID", type: "number" },
    ],
    run: async ({ values }) =>
      reactionService.remove({
        repo: text(values, "repo") || (await inferRepo()),
        reactionId: numberValue(values, "reactionId"),
        issue: numberValue(values, "issue") || undefined,
        comment: numberValue(values, "comment") || undefined,
        reviewComment: numberValue(values, "reviewComment") || undefined,
      }),
  },
];

export default reactionOperations;
