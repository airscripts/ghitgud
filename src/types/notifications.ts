export interface Notification {
  id: string;
  repository: string;
  subjectTitle: string;
  subjectType: string;
  reason: string;
  unread: boolean;
  updatedAt: string;
}

export interface ActivityResult {
  assignedIssues: Notification[];
  reviewRequests: Notification[];
  recentMentions: Notification[];
}

export interface ListOptions {
  all?: boolean;
  repo?: string;
  limit?: number;
  repos?: string[];
  participating?: boolean;
}

export const normalizeThread = (item: unknown): Notification => {
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

export const normalizeIssue = (item: unknown): Notification => {
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

export const normalizeSearchItem = (item: unknown): Notification => {
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
