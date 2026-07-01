import client from "@/providers/github/client";
import { repoPath } from "./path";

const BASE_PATH = "/notifications";

const notifications = {
  fetch: (params?: {
    all?: boolean;
    repo?: string;
    participating?: boolean;
    perPage?: number;
  }): Promise<Response> => {
    const query = new URLSearchParams();
    if (params?.all) query.set("all", "true");
    if (params?.participating) query.set("participating", "true");
    if (params?.perPage) query.set("per_page", String(params.perPage));

    const qs = query.toString();

    const basePath = params?.repo
      ? repoPath(params.repo, "notifications")
      : BASE_PATH;

    const endpoint = qs ? `${basePath}?${qs}` : basePath;
    return client.get(endpoint);
  },

  markRead: (id: string): Promise<Response> => {
    return client.patch(`/notifications/threads/${id}`, {});
  },

  markDone: (id: string): Promise<Response> => {
    return client.put(`/notifications/threads/${id}/subscription`, {
      ignored: true,
    });
  },

  assignedIssues: (repo?: string): Promise<Response> => {
    if (repo) {
      return client.get(
        `${repoPath(repo, "issues")}?state=open&assignee=%40me`,
      );
    }

    return client.get("/issues?filter=assigned&state=open");
  },

  reviewRequests: (repo?: string): Promise<Response> => {
    const repoQualifier = repo ? `+repo:${encodeURIComponent(repo)}` : "";

    return client.get(
      `/search/issues?q=is:pr+is:open+review-requested:@me${repoQualifier}`,
    );
  },

  mentions: (username: string, repo?: string): Promise<Response> => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const repoQualifier = repo ? `+repo:${encodeURIComponent(repo)}` : "";
    return client.get(
      `/search/issues?q=mentions:${username}+updated:>${since}${repoQualifier}`,
    );
  },
};

export default notifications;
