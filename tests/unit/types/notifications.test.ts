import { describe, it, expect } from "vitest";

import {
  normalizeThread,
  normalizeIssue,
  normalizeSearchItem,
} from "@/types/notifications";

describe("notifications types", () => {
  describe("normalizeThread", () => {
    it("normalizes a complete thread", () => {
      const result = normalizeThread({
        id: 1,
        unread: true,
        reason: "mention",
        updated_at: "2026-01-01",
        repository: { full_name: "owner/repo" },
        subject: { title: "Test", type: "Issue" },
      });

      expect(result).toEqual({
        id: "1",
        unread: true,
        reason: "mention",
        subjectType: "Issue",
        subjectTitle: "Test",
        updatedAt: "2026-01-01",
        repository: "owner/repo",
      });
    });

    it("handles missing nested objects", () => {
      const result = normalizeThread({
        id: 2,
        unread: false,
        updated_at: "2026-02-01",
        reason: "review_requested",
      });

      expect(result).toEqual({
        id: "2",
        unread: false,
        repository: "",
        subjectType: "",
        subjectTitle: "",
        updatedAt: "2026-02-01",
        reason: "review_requested",
      });
    });

    it("handles empty input", () => {
      const result = normalizeThread({});

      expect(result).toEqual({
        reason: "",
        unread: false,
        updatedAt: "",
        repository: "",
        id: "undefined",
        subjectType: "",
        subjectTitle: "",
      });
    });
  });

  describe("normalizeIssue", () => {
    it("normalizes an issue", () => {
      const result = normalizeIssue({
        id: 42,
        title: "Bug report",
        updated_at: "2026-03-01",
        repository: { full_name: "owner/repo" },
      });

      expect(result).toEqual({
        id: "42",
        unread: false,
        reason: "assigned",
        subjectType: "Issue",
        updatedAt: "2026-03-01",
        repository: "owner/repo",
        subjectTitle: "Bug report",
      });
    });

    it("detects pull request", () => {
      const result = normalizeIssue({
        id: 43,
        pull_request: {},
        title: "PR title",
        updated_at: "2026-04-01",
      });

      expect(result.subjectType).toBe("PullRequest");
    });
  });

  describe("normalizeSearchItem", () => {
    it("normalizes a search item", () => {
      const result = normalizeSearchItem({
        id: 100,
        title: "Found issue",
        updated_at: "2026-05-01",
        repository_url: "https://api.github.com/repos/owner/repo",
      });

      expect(result).toEqual({
        id: "100",
        unread: false,
        reason: "mention",
        subjectType: "Issue",
        updatedAt: "2026-05-01",
        repository: "owner/repo",
        subjectTitle: "Found issue",
      });
    });

    it("detects pull request from search", () => {
      const result = normalizeSearchItem({
        id: 101,
        pull_request: {},
        title: "Found PR",
      });

      expect(result.subjectType).toBe("PullRequest");
    });

    it("handles missing repository_url", () => {
      const result = normalizeSearchItem({
        id: 102,
        title: "Orphan",
      });

      expect(result.repository).toBe("");
    });
  });
});
