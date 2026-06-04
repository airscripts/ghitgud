import type { TuiOperation } from "../types";
import notificationsService from "@/services/notifications";

import {
  text,
  repoInput,
  numberValue,
  requiredText,
  booleanValue,
} from "./shared";

const notificationOperations: TuiOperation[] = [
  {
    id: "notifications.list",
    workspace: "Notifications",
    title: "List Notifications",
    command: "ghg notifications list",
    description: "List GitHub notifications.",

    inputs: [
      { key: "all", label: "Include read", type: "boolean" },
      { key: "participating", label: "Participating only", type: "boolean" },
      repoInput,
      { key: "limit", label: "Limit", type: "number" },
    ],

    run: ({ values }) =>
      notificationsService.list({
        repo: text(values, "repo"),
        all: booleanValue(values, "all"),
        participating: booleanValue(values, "participating"),
        limit: text(values, "limit") ? numberValue(values, "limit") : undefined,
      }),
  },

  {
    mutates: true,
    id: "notifications.read",
    workspace: "Notifications",
    title: "Mark Notification Read",
    command: "ghg notifications read <id>",
    description: "Mark a notification as read.",

    inputs: [
      { key: "id", label: "Notification ID", type: "string", required: true },
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
      { key: "id", label: "Notification ID", type: "string", required: true },
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
    run: () => notificationsService.activity(),
  },

  {
    id: "mentions",
    title: "Mentions",
    command: "ghg mentions",
    workspace: "Notifications",
    description: "Load recent @mentions.",
    run: () => notificationsService.mentions(),
  },
];

export default notificationOperations;
