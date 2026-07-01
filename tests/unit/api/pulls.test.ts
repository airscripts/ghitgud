import pulls from "@/api/pulls";
import client from "@/providers/github/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    getPaginated: vi.fn(),
    getRepo: vi.fn().mockReturnValue("owner/repo"),
    getDefaultPerPage: vi.fn().mockReturnValue(100),
  },
}));

describe("pulls", () => {
  const mockRepo = "owner/repo";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("countOpen", () => {
    it("should count open PRs", async () => {
      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ total_count: 42 }),
      } as unknown as Response);

      const result = await pulls.countOpen(mockRepo);
      expect(client.get).toHaveBeenCalledWith(
        expect.stringContaining("/search/issues"),
      );

      expect(result).toBe(42);
    });

    it("should encode the query properly", async () => {
      const mockGet = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ total_count: 5 }),
      } as unknown as Response);

      vi.mocked(client.get).mockImplementation(mockGet);
      await pulls.countOpen("owner/repo");
      const callArg = mockGet.mock.calls[0][0];

      expect(callArg).toContain("/search/issues");
      expect(callArg).toContain("q=");
      expect(callArg).toContain("per_page=1");
    });
  });

  describe("listMergedSince", () => {
    it("should list PRs merged since a date", async () => {
      const mockPrs = [
        { created_at: "2024-01-01", merged_at: "2024-01-15" },
        { created_at: "2024-01-02", merged_at: "2024-01-10" },
        { created_at: "2024-01-03", merged_at: null },
      ];

      vi.mocked(client.getPaginated).mockResolvedValue(mockPrs);
      const result = await pulls.listMergedSince(mockRepo, "2024-01-12");

      expect(client.getPaginated).toHaveBeenCalledWith(
        expect.stringContaining("/repos/owner/repo/pulls?state=closed"),
      );

      expect(result).toHaveLength(1);
      expect(result[0].merged_at).toBe("2024-01-15");
    });

    it("should filter out PRs merged before the date", async () => {
      const mockPrs = [
        { created_at: "2024-01-01", merged_at: "2024-01-05" },
        { created_at: "2024-01-02", merged_at: "2024-01-15" },
      ];

      vi.mocked(client.getPaginated).mockResolvedValue(mockPrs);
      const result = await pulls.listMergedSince(mockRepo, "2024-01-10");

      expect(result).toHaveLength(1);
      expect(result[0].merged_at).toBe("2024-01-15");
    });

    it("should filter out unmerged PRs", async () => {
      const mockPrs = [
        { created_at: "2024-01-01", merged_at: null },
        { created_at: "2024-01-02", merged_at: "2024-01-15" },
      ];

      vi.mocked(client.getPaginated).mockResolvedValue(mockPrs);
      const result = await pulls.listMergedSince(mockRepo, "2024-01-01");

      expect(result).toHaveLength(1);
    });
  });
});
