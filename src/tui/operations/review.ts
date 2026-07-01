import type { TuiOperation } from "../types";
import reviewService from "@/services/review";

import {
  text,
  repoInput,
  inferRepo,
  numberValue,
  booleanValue,
  requiredText,
} from "./shared";

const reviewOperations: TuiOperation[] = [
  {
    mutates: true,
    workspace: "Review",
    id: "review.comment",
    title: "Review Comment",
    command: "gitfleet review comment <pr>",
    description: "Create a line review comment.",

    inputs: [
      repoInput,
      { key: "pr", label: "Change number", type: "number", required: true },
      { key: "file", label: "File", type: "string", required: true },
      { key: "line", label: "Line", type: "number", required: true },
      { key: "body", label: "Body", type: "string", required: true },
      { key: "side", label: "Side", type: "string", defaultValue: "RIGHT" },
    ],

    run: async ({ values }) =>
      reviewService.comment({
        repo: text(values, "repo") || (await inferRepo()),
        pr: numberValue(values, "pr"),
        line: numberValue(values, "line"),
        file: requiredText(values, "file"),
        body: requiredText(values, "body"),
        side: requiredText(values, "side") as "LEFT" | "RIGHT",
      }),
  },

  {
    workspace: "Review",
    id: "review.threads",
    title: "Review Threads",
    command: "gitfleet review threads <pr>",
    description: "List review threads for a proposed change.",

    inputs: [
      repoInput,
      { key: "pr", label: "Change number", type: "number", required: true },
    ],

    run: async ({ values }) =>
      reviewService.threads(
        numberValue(values, "pr"),
        text(values, "repo") || (await inferRepo()),
      ),
  },

  {
    mutates: true,
    workspace: "Review",
    id: "review.resolve",
    title: "Resolve Review Thread",
    command: "gitfleet review resolve <thread-id> <pr>",
    description: "Mark a review thread as resolved.",

    inputs: [
      repoInput,
      { key: "threadId", label: "Thread ID", type: "number", required: true },
      { key: "pr", label: "Change number", type: "number", required: true },
    ],

    run: async ({ values }) =>
      reviewService.resolve(
        numberValue(values, "threadId"),
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "pr"),
      ),
  },

  {
    mutates: true,
    workspace: "Review",
    id: "review.suggest",
    title: "Review Suggestion",
    command: "gitfleet review suggest <pr>",
    description: "Create a single-line suggestion.",

    inputs: [
      repoInput,
      { key: "pr", label: "Change number", type: "number", required: true },
      { key: "file", label: "File", type: "string", required: true },
      { key: "line", label: "Line", type: "number", required: true },
      { key: "replace", label: "Replacement", type: "string", required: true },
    ],

    run: async ({ values }) =>
      reviewService.suggest({
        repo: text(values, "repo") || (await inferRepo()),
        pr: numberValue(values, "pr"),
        line: numberValue(values, "line"),
        file: requiredText(values, "file"),
        replace: requiredText(values, "replace"),
      }),
  },

  {
    mutates: true,
    id: "review.apply",
    workspace: "Review",
    title: "Apply Suggestions",
    command: "gitfleet review apply <pr>",
    description: "Apply review suggestions locally.",

    inputs: [
      repoInput,
      { key: "pr", label: "Change number", type: "number", required: true },
      { key: "push", label: "Push", type: "boolean" },
    ],

    run: async ({ values }) =>
      reviewService.apply(
        numberValue(values, "pr"),
        text(values, "repo") || (await inferRepo()),
        booleanValue(values, "push"),
      ),
  },
];

export default reviewOperations;
