import logger from "@/core/logger";
import output from "@/core/output";
import api from "@/api/notifications";
import service from "@/services/notifications";
import { describe, it, expect, vi, Mock, beforeEach } from "vitest";

vi.mock("@/api/notifications", () => ({
  default: {
    fetch: vi.fn(),
    markRead: vi.fn(),
    markDone: vi.fn(),
    assignedIssues: vi.fn(),
    reviewRequests: vi.fn(),
    mentions: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    warn: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSummary: vi.fn(),
  },
}));

const THREAD_RESPONSE = [
  {
    id: "1",
    unread: true,
    reason: "review_requested",
    updated_at: "2026-05-09T20:00:00Z",
    repository: { full_name: "airscripts/gitfleet" },
    subject: { title: "Test PR", type: "PullRequest", url: "..." },
  },
];

const SEARCH_RESPONSE = {
  items: [
    {
      id: 2,
      title: "Mentioned issue",
      updated_at: "2026-05-08T20:00:00Z",
      repository_url: "https://api.github.com/repos/airscripts/gitfleet",
    },
  ],
};

describe("notifications service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return notifications", async () => {
      (api.fetch as Mock).mockResolvedValue({
        json: () => Promise.resolve(THREAD_RESPONSE),
      });

      const result = await service.list();
      expect(api.fetch).toHaveBeenCalledWith({
        all: undefined,
        repo: undefined,
        perPage: undefined,
        participating: undefined,
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toHaveLength(1);
      expect(result.metadata[0].repository).toBe("airscripts/gitfleet");
    });

    it("should pass repo to the notifications api", async () => {
      (api.fetch as Mock).mockResolvedValue({
        json: () => Promise.resolve(THREAD_RESPONSE),
      });

      const result = await service.list({ repo: "other/repo" });
      expect(api.fetch).toHaveBeenCalledWith({
        all: undefined,
        perPage: undefined,
        repo: "other/repo",
        participating: undefined,
      });

      expect(result.metadata).toHaveLength(1);
      expect(output.renderTable).toHaveBeenCalled();
    });

    it("should show success when no notifications", async () => {
      (api.fetch as Mock).mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      const result = await service.list();
      expect(result.metadata).toHaveLength(0);
      expect(logger.success).toHaveBeenCalledWith("Notifications checked.");
    });
  });

  describe("markRead", () => {
    it("should mark notification as read", async () => {
      (api.markRead as Mock).mockResolvedValue({ status: 205 });
      const result = await service.markRead("1");
      expect(result.success).toBe(true);
    });
  });

  describe("markDone", () => {
    it("should mark notification as done", async () => {
      (api.markDone as Mock).mockResolvedValue({ status: 200 });
      const result = await service.markDone("1");
      expect(result.success).toBe(true);
    });
  });

  describe("activity", () => {
    it("should return composite activity", async () => {
      (api.assignedIssues as Mock).mockResolvedValue({
        json: () => Promise.resolve([]),
      });

      (api.reviewRequests as Mock).mockResolvedValue({
        json: () => Promise.resolve(SEARCH_RESPONSE),
      });

      (api.mentions as Mock).mockResolvedValue({
        json: () => Promise.resolve(SEARCH_RESPONSE),
      });

      const result = await service.activity("airscripts/gitfleet");
      expect(api.assignedIssues).toHaveBeenCalledWith("airscripts/gitfleet");
      expect(api.reviewRequests).toHaveBeenCalledWith("airscripts/gitfleet");
      expect(api.mentions).toHaveBeenCalledWith("@me", "airscripts/gitfleet");
      expect(result.success).toBe(true);
      expect(result.metadata.assignedIssues).toHaveLength(0);
      expect(result.metadata.reviewRequests).toHaveLength(1);
      expect(result.metadata.recentMentions).toHaveLength(1);
    });
  });

  describe("mentions", () => {
    it("should return mentions", async () => {
      (api.mentions as Mock).mockResolvedValue({
        json: () => Promise.resolve(SEARCH_RESPONSE),
      });

      const result = await service.mentions("airscripts/gitfleet");
      expect(api.mentions).toHaveBeenCalledWith("@me", "airscripts/gitfleet");
      expect(result.success).toBe(true);
      expect(result.metadata).toHaveLength(1);
    });
  });
});
