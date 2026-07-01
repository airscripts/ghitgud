import client from "@/providers/github/client";
import notifications from "@/api/notifications";
import { describe, it, expect, vi, Mock, beforeEach } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}));

describe("notifications api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call client.get for fetch", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.fetch();
    expect(client.get).toHaveBeenCalledWith("/notifications");
  });

  it("should call client.get with query params", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.fetch({ all: true, participating: true, perPage: 50 });

    expect(client.get).toHaveBeenCalledWith(
      "/notifications?all=true&participating=true&per_page=50",
    );
  });

  it("should call repository notifications endpoint when repo is provided", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.fetch({ repo: "owner/repo", perPage: 25 });

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/notifications?per_page=25",
    );
  });

  it("should call client.patch for markRead", async () => {
    (client.patch as Mock).mockResolvedValue({ status: 205 });
    await notifications.markRead("123");
    expect(client.patch).toHaveBeenCalledWith("/notifications/threads/123", {});
  });

  it("should call client.put for markDone", async () => {
    (client.put as Mock).mockResolvedValue({ status: 200 });
    await notifications.markDone("123");

    expect(client.put).toHaveBeenCalledWith(
      "/notifications/threads/123/subscription",
      { ignored: true },
    );
  });

  it("should call client.get for assignedIssues", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.assignedIssues();

    expect(client.get).toHaveBeenCalledWith(
      "/issues?filter=assigned&state=open",
    );
  });

  it("should call repository issues endpoint for assignedIssues with repo", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.assignedIssues("owner/repo");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/issues?state=open&assignee=%40me",
    );
  });

  it("should call client.get for reviewRequests", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.reviewRequests();

    expect(client.get).toHaveBeenCalledWith(
      "/search/issues?q=is:pr+is:open+review-requested:@me",
    );
  });

  it("should add repo qualifier for reviewRequests with repo", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.reviewRequests("owner/repo");

    expect(client.get).toHaveBeenCalledWith(
      "/search/issues?q=is:pr+is:open+review-requested:@me+repo:owner%2Frepo",
    );
  });

  it("should call client.get for mentions with date filter", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.mentions("@me");
    const call = (client.get as Mock).mock.calls[0][0] as string;
    expect(call).toContain("/search/issues?q=mentions:@me+updated:>");
  });

  it("should add repo qualifier for mentions with repo", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await notifications.mentions("@me", "owner/repo");
    const call = (client.get as Mock).mock.calls[0][0] as string;
    expect(call).toContain("+repo:owner%2Frepo");
  });
});
