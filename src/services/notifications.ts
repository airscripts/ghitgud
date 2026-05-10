import api from "@/api/notifications";
import logger from "@/core/logger";
import { INFO_NO_NOTIFICATIONS } from "@/core/constants";
import {
  Notification,
  ActivityResult,
  ListOptions,
  normalizeThread,
  normalizeIssue,
  normalizeSearchItem,
} from "@/types/notifications";

const formatTable = (notifications: Notification[]) => {
  if (notifications.length === 0) {
    logger.info(INFO_NO_NOTIFICATIONS);
    return;
  }

  console.log();
  console.table(
    notifications.map((n) => ({
      repository: n.repository,
      subject: n.subjectTitle,
      type: n.subjectType,
      reason: n.reason,
    })),
  );
};

const list = async (options: ListOptions = {}) => {
  logger.info("Fetching notifications.");

  const response = await api.fetch({
    all: options.all,
    participating: options.participating,
    perPage: options.limit,
  });

  const data = (await response.json()) as unknown[];
  let notifications = data.map(normalizeThread);

  if (options.repo) {
    notifications = notifications.filter((n) => n.repository === options.repo);
  }

  formatTable(notifications);
  return { success: true, metadata: notifications };
};

const markRead = async (id: string) => {
  logger.info(`Marking notification ${id} as read.`);
  await api.markRead(id);
  logger.success("Notification marked as read.");
  return { success: true };
};

const markDone = async (id: string) => {
  logger.info(`Marking notification ${id} as done.`);
  await api.markDone(id);
  logger.success("Notification marked as done.");
  return { success: true };
};

const activity = async () => {
  logger.info("Fetching activity.");

  const [issuesRes, reviewsRes, mentionsRes] = await Promise.all([
    api.assignedIssues(),
    api.reviewRequests(),
    api.mentions("@me"),
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

  console.log();
  console.log("Assigned Issues:", result.assignedIssues.length);
  console.log("Review Requests:", result.reviewRequests.length);
  console.log("Recent Mentions:", result.recentMentions.length);

  return { success: true, metadata: result };
};

const mentions = async () => {
  logger.info("Fetching mentions.");

  const response = await api.mentions("@me");
  const data = (await response.json()) as { items?: unknown[] };
  const notifications = (data.items ?? []).map(normalizeSearchItem);

  formatTable(notifications);
  return { success: true, metadata: notifications };
};

export default { list, markRead, markDone, activity, mentions };
