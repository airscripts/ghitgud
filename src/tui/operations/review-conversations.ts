import type { TuiOperation } from "../types";
import commentService from "@/services/comment";
import {
  text,
  numberValue,
  requiredText,
  repoInput,
  inferRepo,
} from "./shared";

const commentOperations: TuiOperation[] = [
  {
    workspace: "Comments",
    id: "comment.list",
    title: "List Comments",
    command: "gitfleet comment list --issue <number>",
    description: "List comments on an issue or PR.",
    inputs: [
      repoInput,
      {
        key: "issue",
        label: "Issue/PR number",
        type: "number",
        required: true,
      },
    ],
    run: async ({ values }) =>
      commentService.list({
        repo: text(values, "repo") || (await inferRepo()),
        issue: numberValue(values, "issue"),
      }),
  },
  {
    mutates: true,
    workspace: "Comments",
    id: "comment.reply",
    title: "Reply to Comment",
    command: "gitfleet comment reply --issue <number> --body <text>",
    description: "Add a comment to an issue or PR.",
    inputs: [
      repoInput,
      {
        key: "issue",
        label: "Issue/PR number",
        type: "number",
        required: true,
      },
      { key: "body", label: "Comment body", type: "string", required: true },
    ],
    run: async ({ values }) =>
      commentService.reply({
        repo: text(values, "repo") || (await inferRepo()),
        issue: numberValue(values, "issue"),
        body: requiredText(values, "body"),
      }),
  },
  {
    mutates: true,
    workspace: "Comments",
    id: "comment.delete",
    title: "Delete Comment",
    command: "gitfleet comment delete <id>",
    description: "Delete a comment.",
    inputs: [
      repoInput,
      { key: "commentId", label: "Comment ID", type: "number", required: true },
    ],
    run: async ({ values }) =>
      commentService.remove({
        repo: text(values, "repo") || (await inferRepo()),
        commentId: numberValue(values, "commentId"),
      }),
  },
];

export default commentOperations;
