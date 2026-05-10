import client from "./client";

const BASE_PATH = "/notifications";

const notifications = {
  fetch: (params?: {
    all?: boolean;
    participating?: boolean;
    perPage?: number;
  }): Promise<Response> => {
    const query = new URLSearchParams();
    if (params?.all) query.set("all", "true");
    if (params?.participating) query.set("participating", "true");
    if (params?.perPage) query.set("per_page", String(params.perPage));

    const qs = query.toString();
    const endpoint = qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
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

  assignedIssues: (): Promise<Response> => {
    return client.get("/issues?filter=assigned&state=open");
  },

  reviewRequests: (): Promise<Response> => {
    return client.get("/search/issues?q=is:pr+is:open+review-requested:@me");
  },

  mentions: (username: string): Promise<Response> => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    return client.get(
      `/search/issues?q=mentions:${username}+updated:>${since}`,
    );
  },
};

export default notifications;
