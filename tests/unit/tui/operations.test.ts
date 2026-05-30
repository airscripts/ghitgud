import { describe, it, expect } from "vitest";

import operations, { workspaces } from "@/tui/operations";

const EXPECTED_OPERATION_IDS = [
  "dashboard.overview",
  "notifications.list",
  "notifications.read",
  "notifications.done",
  "activity",
  "mentions",
  "labels.list",
  "labels.pull",
  "labels.push",
  "labels.prune",
  "pr.cleanup",
  "pr.push",
  "pr.next",
  "pr.stack.create",
  "pr.stack.list",
  "pr.stack.update",
  "pr.stack.push",
  "review.comment",
  "review.threads",
  "review.resolve",
  "review.suggest",
  "review.apply",
  "repos.inspect",
  "repos.govern",
  "repos.label",
  "repos.retire",
  "repos.report",
  "insights.traffic",
  "insights.contributors",
  "insights.commits",
  "insights.frequency",
  "insights.popularity",
  "insights.participation",
  "workflow.validate",
  "workflow.preview",
  "cache.inspect",
  "cache.download",
  "run.debug",
  "profile.add",
  "profile.list",
  "profile.switch",
  "profile.detect",
  "config.set",
  "config.get",
  "config.unset",
  "ping",
  "version",
  "proxy",
];

describe("tui operations", () => {
  it("should cover every current ghg command workflow", () => {
    const ids = operations.map((operation) => operation.id);
    expect(ids).toEqual(EXPECTED_OPERATION_IDS);
  });

  it("should define valid workspace metadata", () => {
    expect(workspaces).toContain("Dashboard");

    for (const operation of operations) {
      expect(operation.title).not.toEqual("");
      expect(operation.command).toMatch(/^ghg /);
      expect(workspaces).toContain(operation.workspace);
    }
  });

  it("should flag mutating operations", () => {
    const mutating = operations
      .filter((operation) => operation.mutates)
      .map((operation) => operation.id);

    expect(mutating).toContain("notifications.read");
    expect(mutating).toContain("repos.govern");
    expect(mutating).toContain("config.set");
  });
});
