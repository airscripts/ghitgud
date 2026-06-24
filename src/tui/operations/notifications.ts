import type { TuiOperation } from "../types";
import reposService from "@/services/repos/index";
import notificationsService from "@/services/notifications";

import {
  text,
  repoInput,
  numberValue,
  requiredText,
  booleanValue,
  targetInputs,
  targetOptions,
  inferRepoOptional,
} from "./shared";

const notificationOperations: TuiOperation[] = [
  {
    id: "notifications.list",
    workspace: "Notifications",
    title: "List Notifications",
    command: "ghg notifications list",
    description: "List GitHub notifications.",

    inputs: [
      repoInput,
      { key: "all", label: "Include read", type: "boolean" },
      {
        key: "participating",
        label: "Participating only",
        type: "boolean",
      },
      { key: "limit", label: "Limit", type: "number" },
    ],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());
      return notificationsService.list({
        repo,
        all: booleanValue(values, "all"),
        participating: booleanValue(values, "participating"),
        limit: text(values, "limit") ? numberValue(values, "limit") : undefined,
      });
    },
  },

  {
    mutates: true,
    workspace: "Notifications",
    id: "notifications.list-by-target",
    title: "List Notifications by Target",
    command: "ghg notifications list --repo <targets>",

    description:
      "List notifications for a set of repositories (org, repos list, or file).",

    inputs: [
      ...targetInputs,
      { key: "all", label: "Include read", type: "boolean" },
      {
        key: "participating",
        label: "Participating only",
        type: "boolean",
      },
    ],

    run: async ({ values }) => {
      const targets = targetOptions(values);
      const repoSummaries = await reposService.resolveTargets(targets);
      const repos = repoSummaries.map((r) => r.fullName);

      return notificationsService.list({
        repos,
        all: booleanValue(values, "all"),
        participating: booleanValue(values, "participating"),
      });
    },
  },

  {
    mutates: true,
    id: "notifications.read",
    workspace: "Notifications",
    title: "Mark Notification Read",
    command: "ghg notifications read <id>",
    description: "Mark a notification as read.",

    inputs: [
      {
        key: "id",
        label: "Notification ID",
        type: "string",
        required: true,
      },
    ],

    run: ({ values }) =>
      notificationsService.markRead(requiredText(values, "id")),
  },

  {
    mutates: true,
    id: "notifications.done",
    workspace: "Notifications",
    title: "Mark Notification Done",
    command: "ghg notifications done <id>",
    description: "Mark a notification as done.",

    inputs: [
      {
        key: "id",
        label: "Notification ID",
        type: "string",
        required: true,
      },
    ],

    run: ({ values }) =>
      notificationsService.markDone(requiredText(values, "id")),
  },

  {
    id: "activity",
    title: "Activity",
    command: "ghg activity",
    workspace: "Notifications",
    description: "Load assigned issues, review requests, and mentions.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());
      return notificationsService.activity(repo);
    },
  },

  {
    id: "mentions",
    title: "Mentions",
    command: "ghg mentions",
    workspace: "Notifications",
    description: "Load recent @mentions.",
    inputs: [repoInput],

    run: async ({ values }) => {
      const repo = text(values, "repo") || (await inferRepoOptional());
      return notificationsService.mentions(repo);
    },
  },
];

export default notificationOperations;
