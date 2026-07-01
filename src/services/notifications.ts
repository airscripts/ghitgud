import output from "@/core/output";
import logger from "@/core/logger";
import api from "@/api/notifications";
import { INFO_NO_NOTIFICATIONS } from "@/core/constants";

import {
  ListOptions,
  Notification,
  ActivityResult,
  normalizeIssue,
  normalizeThread,
  normalizeSearchItem,
} from "@/types/notifications";

const formatTable = (notifications: Notification[]) => {
  output.renderTable(
    notifications.map((n) => ({
      repository: n.repository,
      subject: n.subjectTitle,
      type: n.subjectType,
      reason: n.reason,
    })),
    { emptyMessage: INFO_NO_NOTIFICATIONS },
  );
};

const list = async (options: ListOptions = {}) => {
  logger.start("Loading notifications.");

  if (options.repos && options.repos.length > 0) {
    const allNotifications: Notification[] = [];

    for (const repo of options.repos) {
      const response = await api.fetch({
        all: options.all,
        repo,
        participating: options.participating,
        perPage: options.limit,
      });

      const data = (await response.json()) as unknown[];
      const notifications = data.map(normalizeThread);
      allNotifications.push(...notifications);
    }

    allNotifications.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    const notifications = options.limit
      ? allNotifications.slice(0, options.limit)
      : allNotifications;

    formatTable(notifications);
    logger.success(
      notifications.length
        ? `Loaded ${notifications.length} notification(s).`
        : "Notifications checked.",
    );

    return { success: true, metadata: notifications };
  }

  const response = await api.fetch({
    all: options.all,
    repo: options.repo,
    participating: options.participating,
    perPage: options.limit,
  });

  const data = (await response.json()) as unknown[];
  const notifications = data.map(normalizeThread);

  formatTable(notifications);
  logger.success(
    notifications.length
      ? `Loaded ${notifications.length} notification(s).`
      : "Notifications checked.",
  );

  return { success: true, metadata: notifications };
};

const markRead = async (id: string) => {
  logger.start(`Marking notification ${id} as read.`);
  await api.markRead(id);
  logger.success("Notification marked as read.");
  return { success: true };
};

const markDone = async (id: string) => {
  logger.start(`Marking notification ${id} as done.`);
  await api.markDone(id);
  logger.success("Notification marked as done.");
  return { success: true };
};

const activity = async (repo?: string) => {
  logger.start("Loading your provider activity.");

  const [issuesRes, reviewsRes, mentionsRes] = await Promise.all([
    api.assignedIssues(repo),
    api.reviewRequests(repo),
    api.mentions("@me", repo),
  ]);

  const assignedIssues = (await issuesRes.json()) as unknown[];
  const reviewData = (await reviewsRes.json()) as {
    items?: unknown[];
  };
  const mentionData = (await mentionsRes.json()) as {
    items?: unknown[];
  };

  const result: ActivityResult = {
    assignedIssues: assignedIssues.map(normalizeIssue),
    reviewRequests: (reviewData.items ?? []).map(normalizeSearchItem),
    recentMentions: (mentionData.items ?? []).map(normalizeSearchItem),
  };

  output.renderSummary("Activity", [
    ["Assigned Issues", result.assignedIssues.length],
    ["Review Requests", result.reviewRequests.length],
    ["Recent Mentions", result.recentMentions.length],
  ]);

  logger.success("Activity loaded.");
  return { success: true, metadata: result };
};

const mentions = async (repo?: string) => {
  logger.start("Loading recent mentions.");

  const response = await api.mentions("@me", repo);
  const data = (await response.json()) as { items?: unknown[] };
  const notifications = (data.items ?? []).map(normalizeSearchItem);

  formatTable(notifications);
  logger.success(
    notifications.length
      ? `Loaded ${notifications.length} mention(s).`
      : "Mentions checked.",
  );

  return { success: true, metadata: notifications };
};

export default { list, markRead, markDone, activity, mentions };
