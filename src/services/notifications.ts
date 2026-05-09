import api from "@/api/notifications";
import logger from "@/core/logger";

interface Notification {
  id: string;
  repository: string;
  subjectTitle: string;
  subjectType: string;
  reason: string;
  unread: boolean;
  updatedAt: string;
}

interface ActivityResult {
  assignedIssues: Notification[];
  reviewRequests: Notification[];
  recentMentions: Notification[];
}

const normalizeThread = (item: unknown): Notification => {
  const data = item as Record<string, unknown>;
  const repo = (data.repository ?? {}) as Record<string, unknown>;
  const subject = (data.subject ?? {}) as Record<string, unknown>;

  return {
    id: String(data.id),
    repository: String(repo.full_name ?? ""),
    subjectTitle: String(subject.title ?? ""),
    subjectType: String(subject.type ?? ""),
    reason: String(data.reason ?? ""),
    unread: Boolean(data.unread),
    updatedAt: String(data.updated_at ?? ""),
  };
};

const normalizeIssue = (item: unknown): Notification => {
  const data = item as Record<string, unknown>;
  const repo = (data.repository ?? {}) as Record<string, unknown>;

  return {
    id: String(data.id),
    repository: String(repo.full_name ?? ""),
    subjectTitle: String(data.title ?? ""),
    subjectType: String(data.pull_request ? "PullRequest" : "Issue"),
    reason: "assigned",
    unread: false,
    updatedAt: String(data.updated_at ?? ""),
  };
};

const normalizeSearchItem = (item: unknown): Notification => {
  const data = item as Record<string, unknown>;

  return {
    id: String(data.id),
    repository: String(data.repository_url ?? "").replace(
      "https://api.github.com/repos/",
      "",
    ),
    subjectTitle: String(data.title ?? ""),
    subjectType: String(data.pull_request ? "PullRequest" : "Issue"),
    reason: "mention",
    unread: false,
    updatedAt: String(data.updated_at ?? ""),
  };
};

const formatTable = (notifications: Notification[]) => {
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

interface ListOptions {
  all?: boolean;
  participating?: boolean;
  repo?: string;
  limit?: number;
}

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
