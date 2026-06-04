import issueService from "@/services/issue";
import type { TuiOperation } from "../types";
import { text, numberValue, requiredText } from "./shared";

const issueOperations: TuiOperation[] = [
  {
    workspace: "Issues",
    title: "List Sub-Issues",
    id: "issue.subtasks.list",
    command: "ghg issue subtasks <issue>",
    description: "List sub-issues for a parent issue.",

    inputs: [
      { key: "issue", label: "Parent issue", type: "number", required: true },
    ],

    run: ({ values }) =>
      issueService.subtasks(String(numberValue(values, "issue"))),
  },

  {
    mutates: true,
    workspace: "Issues",
    title: "Create Sub-Issue",
    id: "issue.subtasks.create",
    command: "ghg issue subtasks <issue> --create",
    description: "Create a new issue and link it as a sub-issue.",

    inputs: [
      { key: "issue", label: "Parent issue", type: "number", required: true },
      { key: "title", label: "Title", type: "string", required: true },
      { key: "body", label: "Body", type: "string" },
    ],

    run: ({ values }) =>
      issueService.subtasks(String(numberValue(values, "issue")), {
        create: true,
        body: text(values, "body"),
        title: requiredText(values, "title"),
      }),
  },

  {
    mutates: true,
    workspace: "Issues",
    title: "Link Sub-Issue",
    id: "issue.subtasks.link",
    command: "ghg issue subtasks <issue> --link <issue>",
    description: "Link an existing issue as a sub-issue.",

    inputs: [
      { key: "issue", label: "Parent issue", type: "number", required: true },
      { key: "link", label: "Child issue", type: "number", required: true },
    ],

    run: ({ values }) =>
      issueService.subtasks(String(numberValue(values, "issue")), {
        link: String(numberValue(values, "link")),
      }),
  },

  {
    mutates: true,
    id: "issue.parent",
    workspace: "Issues",
    title: "Set Issue Parent",
    command: "ghg issue parent <child> --parent <parent>",
    description: "Link an existing issue to a parent issue.",

    inputs: [
      { key: "child", label: "Child issue", type: "number", required: true },
      { key: "parent", label: "Parent issue", type: "number", required: true },
    ],

    run: ({ values }) =>
      issueService.parent(String(numberValue(values, "child")), {
        parent: String(numberValue(values, "parent")),
      }),
  },
];

export default issueOperations;
