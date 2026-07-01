import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    getTokenRequired: vi.fn(),
  },
}));

import client from "@/providers/github/client";
import insights from "@/api/insights";

describe("insights", () => {
  const mockRepo = "owner/repo";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getTrafficViews", () => {
    it("should fetch traffic views", async () => {
      const mockResponse = {
        count: 100,
        uniques: 50,
        views: [{ count: 10, uniques: 5, timestamp: "2024-01-01" }],
      };

      vi.mocked(client.getTokenRequired).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await insights.getTrafficViews(mockRepo);
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        `/repos/${mockRepo}/traffic/views`,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getTrafficClones", () => {
    it("should fetch traffic clones", async () => {
      const mockResponse = {
        count: 20,
        uniques: 10,
        clones: [{ count: 5, uniques: 3, timestamp: "2024-01-01" }],
      };

      vi.mocked(client.getTokenRequired).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await insights.getTrafficClones(mockRepo);
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        `/repos/${mockRepo}/traffic/clones`,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getReferrers", () => {
    it("should fetch popular referrers", async () => {
      const mockResponse = [
        { referrer: "Google", count: 50, uniques: 40 },
        { referrer: "GitHub", count: 30, uniques: 25 },
      ];

      vi.mocked(client.getTokenRequired).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await insights.getReferrers(mockRepo);
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        `/repos/${mockRepo}/traffic/popular/referrers`,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getPopularPaths", () => {
    it("should fetch popular paths", async () => {
      const mockResponse = [
        { path: "/", title: "Home", count: 100, uniques: 80 },
        { path: "/docs", title: "Docs", count: 50, uniques: 40 },
      ];

      vi.mocked(client.getTokenRequired).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await insights.getPopularPaths(mockRepo);
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        `/repos/${mockRepo}/traffic/popular/paths`,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getContributors", () => {
    it("should fetch contributors", async () => {
      const mockResponse = [
        { id: 1, login: "user1", contributions: 50 },
        { id: 2, login: "user2", contributions: 30 },
      ];

      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await insights.getContributors(mockRepo);
      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/contributors`,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getCommitActivity", () => {
    it("should fetch commit activity", async () => {
      const mockResponse = [
        { week: 1704067200, total: 10, days: [1, 2, 3, 4, 0, 0, 0] },
      ];

      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await insights.getCommitActivity(mockRepo);
      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/stats/commit_activity`,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getCodeFrequency", () => {
    it("should fetch code frequency", async () => {
      const mockResponse: Array<[number, number, number]> = [
        [1704067200, 100, -50],
      ];

      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await insights.getCodeFrequency(mockRepo);
      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/stats/code_frequency`,
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("getParticipation", () => {
    it("should fetch participation stats", async () => {
      const mockResponse = {
        all: [1, 2, 3, 4, 5],
        owner: [1, 1, 1, 1, 1],
      };

      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      } as unknown as Response);

      const result = await insights.getParticipation(mockRepo);
      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/stats/participation`,
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
