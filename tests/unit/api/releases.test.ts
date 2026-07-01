import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRepo = "owner/repo";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    getRepo: vi.fn(() => mockRepo),
  },
}));

import client from "@/providers/github/client";
import releases from "@/api/releases";

describe("releases api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchByTag", () => {
    it("should fetch a release by tag", async () => {
      const mockRelease = {
        id: 1,
        draft: false,
        tag_name: "2.10.0",
        name: "Release 2.10.0",
        html_url: "https://github.com/owner/repo/releases/tag/2.10.0",
      };

      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockRelease),
      } as unknown as Response);

      const result = await releases.fetchByTag(mockRepo, "2.10.0");
      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/releases/tags/2.10.0`,
      );

      expect(result.tag_name).toBe("2.10.0");
    });

    it("should encode tag names in path segments", async () => {
      const mockRelease = {
        id: 1,
        draft: false,
        name: "Release 2.10.0",
        tag_name: "release/2.10.0",
        html_url: "https://github.com/owner/repo/releases/tag/release/2.10.0",
      };

      vi.mocked(client.get).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockRelease),
      } as unknown as Response);

      const result = await releases.fetchByTag(mockRepo, "release/2.10.0");
      expect(client.get).toHaveBeenCalledWith(
        `/repos/${mockRepo}/releases/tags/release%2F2.10.0`,
      );

      expect(result.tag_name).toBe("release/2.10.0");
    });
  });

  describe("create", () => {
    it("should create a release", async () => {
      const mockRelease = {
        id: 2,
        draft: true,
        tag_name: "2.10.0",
        html_url: "https://github.com/owner/repo/releases/tag/2.10.0",
      };

      vi.mocked(client.post).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockRelease),
      } as unknown as Response);

      const body = {
        draft: true,
        tag_name: "2.10.0",
        name: "Release 2.10.0",
        generate_release_notes: true,
      };

      const result = await releases.create(mockRepo, body);
      expect(client.post).toHaveBeenCalledWith(
        `/repos/${mockRepo}/releases`,
        body,
      );

      expect(result.tag_name).toBe("2.10.0");
    });
  });
});
