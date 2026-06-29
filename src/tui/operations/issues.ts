import issueService from "@/services/issue";
import type { TuiOperation } from "../types";

import {
  text,
  repoInput,
  inferRepo,
  numberValue,
  requiredText,
} from "./shared";

const issueOperations: TuiOperation[] = [
  {
    workspace: "Issues",
    title: "List Sub-Issues",
    id: "issue.subtasks.list",
    command: "ghg issue subtasks <issue>",
    description: "List sub-issues for a parent issue.",

    inputs: [
      repoInput,
      { key: "issue", label: "Parent issue", type: "number", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());
      return issueService.subtasks(repo, String(numberValue(values, "issue")));
    },
  },

  {
    mutates: true,
    workspace: "Issues",
    title: "Create Sub-Issue",
    id: "issue.subtasks.create",
    command: "ghg issue subtasks <issue> --create",
    description: "Create a new issue and link it as a sub-issue.",

    inputs: [
      repoInput,
      { key: "issue", label: "Parent issue", type: "number", required: true },
      { key: "title", label: "Title", type: "string", required: true },
      { key: "body", label: "Body", type: "string" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return issueService.subtasks(repo, String(numberValue(values, "issue")), {
        create: true,
        body: text(values, "body"),
        title: requiredText(values, "title"),
      });
    },
  },

  {
    mutates: true,
    workspace: "Issues",
    title: "Link Sub-Issue",
    id: "issue.subtasks.link",
    command: "ghg issue subtasks <issue> --link <issue>",
    description: "Link an existing issue as a sub-issue.",

    inputs: [
      repoInput,
      { key: "issue", label: "Parent issue", type: "number", required: true },
      { key: "link", label: "Child issue", type: "number", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return issueService.subtasks(repo, String(numberValue(values, "issue")), {
        link: String(numberValue(values, "link")),
      });
    },
  },

  {
    mutates: true,
    id: "issue.parent",
    workspace: "Issues",
    title: "Set Issue Parent",
    command: "ghg issue parent <child> --parent <parent>",
    description: "Link an existing issue to a parent issue.",

    inputs: [
      repoInput,
      { key: "child", label: "Child issue", type: "number", required: true },
      { key: "parent", label: "Parent issue", type: "number", required: true },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      return issueService.parent(repo, String(numberValue(values, "child")), {
        parent: String(numberValue(values, "parent")),
      });
    },
  },

  {
    mutates: true,
    id: "issue.create",
    workspace: "Issues",
    title: "Create Issue",
    command: "ghg issue create",
    description: "Create a repository issue.",

    inputs: [
      repoInput,
      { key: "title", label: "Title", type: "string", required: true },
      { key: "body", label: "Body", type: "string" },

      {
        key: "labels",
        type: "string",
        label: "Labels",
        placeholder: "bug,help wanted",
      },

      {
        type: "string",
        key: "assignees",
        label: "Assignees",
        placeholder: "octocat",
      },

      { key: "issueType", label: "Issue type", type: "string" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      const split = (key: string) =>
        text(values, key)
          ?.split(",")
          .map((item) => item.trim())
          .filter(Boolean);

      return issueService.create(repo, {
        labels: split("labels"),
        body: text(values, "body"),
        assignees: split("assignees"),
        type: text(values, "issueType"),
        title: requiredText(values, "title"),
      });
    },
  },

  {
    id: "issue.list",
    workspace: "Issues",
    title: "List Issues",
    command: "ghg issue list",
    description: "List filtered repository issues.",

    inputs: [
      repoInput,
      { key: "state", label: "State", type: "string", defaultValue: "open" },
      { key: "limit", label: "Limit", type: "number", defaultValue: 10 },
      { key: "labels", label: "Labels", type: "string" },
      { key: "assignees", label: "Assignees", type: "string" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepo());

      const split = (key: string) =>
        text(values, key)
          ?.split(",")
          .map((item) => item.trim())
          .filter(Boolean);

      return issueService.list(repo, {
        labels: split("labels"),
        assignees: split("assignees"),
        limit: numberValue(values, "limit"),
        state: (text(values, "state") ?? "open") as "open" | "closed" | "all",
      });
    },
  },

  {
    id: "issue.view",
    workspace: "Issues",
    title: "View Issue",
    command: "ghg issue view <number>",
    description: "View issue details.",

    inputs: [
      repoInput,
      { key: "issue", label: "Issue", type: "number", required: true },
    ],

    run: async ({ values }) =>
      issueService.view(
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "issue"),
      ),
  },

  {
    mutates: true,
    id: "issue.edit",
    workspace: "Issues",
    title: "Edit Issue",
    command: "ghg issue edit <number>",
    description: "Replace an issue title or body.",

    inputs: [
      repoInput,
      { key: "issue", label: "Issue", type: "number", required: true },
      { key: "title", label: "Title", type: "string" },
      { key: "body", label: "Body", type: "string" },
      { key: "removeBody", label: "Remove body", type: "boolean" },
    ],

    run: async ({ values }) =>
      issueService.edit(
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "issue"),

        {
          body: text(values, "body"),
          title: text(values, "title"),
          removeBody: values.removeBody === true,
        },
      ),
  },

  ...(
    ["close", "reopen", "lock", "unlock", "pin", "unpin", "delete"] as const
  ).map(
    (action): TuiOperation => ({
      mutates: true,
      id: `issue.${action}`,
      workspace: "Issues",
      title: `${action[0].toUpperCase()}${action.slice(1)} Issue`,
      command: `ghg issue ${action} <number>`,
      description: `${action[0].toUpperCase()}${action.slice(1)} an issue.`,

      inputs: [
        repoInput,
        { key: "issue", label: "Issue", type: "number", required: true },
      ],

      run: async ({ values }) =>
        issueService[action](
          text(values, "repo") || (await inferRepo()),
          numberValue(values, "issue"),
        ),
    }),
  ),

  {
    mutates: true,
    id: "issue.comment",
    workspace: "Issues",
    title: "Comment on Issue",
    command: "ghg issue comment <number>",
    description: "Add an issue comment.",
    inputs: [
      repoInput,
      { key: "issue", label: "Issue", type: "number", required: true },
      { key: "body", label: "Body", type: "string", required: true },
    ],
    run: async ({ values }) =>
      issueService.comment(
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "issue"),
        requiredText(values, "body"),
      ),
  },

  {
    mutates: true,
    id: "issue.transfer",
    workspace: "Issues",
    title: "Transfer Issue",
    command: "ghg issue transfer <number> --repo <target>",
    description: "Transfer an issue to another repository.",

    inputs: [
      repoInput,
      { key: "issue", label: "Issue", type: "number", required: true },

      {
        key: "target",
        type: "string",
        required: true,
        label: "Target repository",
      },
    ],

    run: async ({ values }) =>
      issueService.transfer(
        text(values, "repo") || (await inferRepo()),
        numberValue(values, "issue"),
        requiredText(values, "target"),
      ),
  },

  {
    id: "issue.status",
    workspace: "Issues",
    title: "Issue Status",
    command: "ghg issue status",
    description: "Show assigned, created, and mentioned open issues.",
    inputs: [repoInput],
    run: async ({ values }) => issueService.status(text(values, "repo")),
  },
];

export default issueOperations;
