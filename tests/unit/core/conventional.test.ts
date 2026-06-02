import { describe, it, expect } from "vitest";

import {
  parseCommit,
  groupByCategory,
  detectBumpLevel,
  renderChangelog,
  mapToChangelogCategory,
} from "@/core/conventional";

describe("conventional", () => {
  describe("parseCommit", () => {
    it("should parse a feat commit", () => {
      const result = parseCommit("abc123", "feat(core): add parser", "");

      expect(result.hash).toBe("abc123");
      expect(result.type).toBe("feat");
      expect(result.scope).toBe("core");
      expect(result.subject).toBe("add parser");
      expect(result.breaking).toBe(false);
      expect(result.deprecated).toBe(false);
    });

    it("should parse a fix commit without scope", () => {
      const result = parseCommit("def456", "fix: resolve crash", "");

      expect(result.type).toBe("fix");
      expect(result.scope).toBeNull();
      expect(result.subject).toBe("resolve crash");
    });

    it("should detect breaking change with !", () => {
      const result = parseCommit("ghi789", "feat(api)!: remove v1", "");

      expect(result.type).toBe("feat");
      expect(result.breaking).toBe(true);
    });

    it("should detect BREAKING CHANGE in body", () => {
      const result = parseCommit(
        "jkl012",
        "refactor: migrate to new arch",
        "BREAKING CHANGE: drops node 18 support",
      );

      expect(result.breaking).toBe(true);
    });

    it("should detect deprecated in body", () => {
      const result = parseCommit(
        "mno345",
        "docs: update readme",
        "This feature is deprecated.",
      );

      expect(result.deprecated).toBe(true);
    });

    it("should return null type for non-conventional commit", () => {
      const result = parseCommit("pqr678", "Update readme", "");

      expect(result.type).toBeNull();
      expect(result.scope).toBeNull();
    });
  });

  describe("mapToChangelogCategory", () => {
    it("maps feat to Added", () => {
      const commit = parseCommit("a", "feat: x", "");
      expect(mapToChangelogCategory(commit)).toBe("Added");
    });

    it("maps fix to Fixed", () => {
      const commit = parseCommit("a", "fix: x", "");
      expect(mapToChangelogCategory(commit)).toBe("Fixed");
    });

    it("maps breaking change to Changed", () => {
      const commit = parseCommit("a", "feat!: x", "");
      expect(mapToChangelogCategory(commit)).toBe("Changed");
    });

    it("maps deprecated to Deprecated", () => {
      const commit = parseCommit("a", "feat: x", "This is deprecated.");
      expect(mapToChangelogCategory(commit)).toBe("Deprecated");
    });

    it("maps security to Security", () => {
      const commit = parseCommit("a", "security: patch vuln", "");
      expect(mapToChangelogCategory(commit)).toBe("Security");
    });

    it("returns null for chore", () => {
      const commit = parseCommit("a", "chore: cleanup", "");
      expect(mapToChangelogCategory(commit)).toBeNull();
    });
  });

  describe("groupByCategory", () => {
    it("should group commits into categories", () => {
      const commits = [
        parseCommit("a", "feat: new thing", ""),
        parseCommit("b", "fix: bug", ""),
        parseCommit("c", "chore: cleanup", ""),
        parseCommit("d", "feat!: breaking", ""),
      ];

      const groups = groupByCategory(commits);

      expect(groups.Added).toEqual(["new thing"]);
      expect(groups.Fixed).toEqual(["bug"]);
      expect(groups.Changed).toEqual(["breaking"]);
      expect(groups.Security).toEqual([]);
    });

    it("should include scope in line when present", () => {
      const commits = [parseCommit("a", "feat(ui): button", "")];
      const groups = groupByCategory(commits);

      expect(groups.Added).toEqual(["button (ui)"]);
    });
  });

  describe("detectBumpLevel", () => {
    it("returns major for breaking change", () => {
      const commits = [parseCommit("a", "feat!: x", "")];
      expect(detectBumpLevel(commits)).toBe("major");
    });

    it("returns minor for feat", () => {
      const commits = [parseCommit("a", "feat: x", "")];
      expect(detectBumpLevel(commits)).toBe("minor");
    });

    it("returns patch for fix", () => {
      const commits = [parseCommit("a", "fix: x", "")];
      expect(detectBumpLevel(commits)).toBe("patch");
    });

    it("returns null for only chore/docs", () => {
      const commits = [
        parseCommit("a", "chore: x", ""),
        parseCommit("b", "docs: y", ""),
      ];

      expect(detectBumpLevel(commits)).toBeNull();
    });

    it("prioritizes major over minor", () => {
      const commits = [
        parseCommit("a", "feat: x", ""),
        parseCommit("b", "feat!: y", ""),
      ];

      expect(detectBumpLevel(commits)).toBe("major");
    });
  });

  describe("renderChangelog", () => {
    it("renders markdown sections", () => {
      const groups = {
        Added: ["feature A"],
        Fixed: ["bug B"],
        Changed: [],
        Deprecated: [],
        Removed: [],
        Security: [],
      };

      const result = renderChangelog(groups);
      expect(result).toContain("### Added");
      expect(result).toContain("- feature A");
      expect(result).toContain("### Fixed");
      expect(result).toContain("- bug B");
    });

    it("omits empty categories", () => {
      const groups = {
        Added: ["feature A"],
        Fixed: [],
        Changed: [],
        Deprecated: [],
        Removed: [],
        Security: [],
      };

      const result = renderChangelog(groups);
      expect(result).toContain("### Added");
      expect(result).not.toContain("### Fixed");
    });
  });
});
