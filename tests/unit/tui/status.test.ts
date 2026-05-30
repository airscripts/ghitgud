import { describe, it, expect } from "vitest";

import { buildStatusItems, formatCwd, getActiveProfile } from "@/tui/status";

describe("tui status", () => {
  it("should show token set state", () => {
    const items = buildStatusItems(
      { workspace: "Dashboard", operationCount: 4 },

      {
        cwd: "/repo",
        token: "ghp_test",
        repo: "owner/repo",
        profiles: [{ name: "work", active: true }],
      },
    );

    expect(items[0]).toMatchObject({
      value: "set",
      label: "token",
      tone: "success",
    });
  });

  it("should show missing token and repo fallback", () => {
    const items = buildStatusItems(
      { workspace: "Dashboard", operationCount: 4 },

      {
        cwd: "/repo",
        repo: null,
        token: null,
        profiles: [],
      },
    );

    expect(items.find((item) => item.label === "token")).toMatchObject({
      tone: "danger",
      value: "missing",
    });

    expect(items.find((item) => item.label === "repo")).toMatchObject({
      tone: "warning",
      value: "not set",
    });
  });

  it("should use the active profile or default fallback", () => {
    expect(
      getActiveProfile([
        { name: "default", active: false },
        { name: "work", active: true },
      ]),
    ).toBe("work");

    expect(getActiveProfile([])).toBe("default");
  });

  it("should include workspace and operation count", () => {
    const items = buildStatusItems(
      { workspace: "Review", operationCount: 5 },
      { cwd: "/repo", repo: "owner/repo", token: "token", profiles: [] },
    );

    expect(items.find((item) => item.label === "workspace")?.value).toBe(
      "Review",
    );

    expect(items.find((item) => item.label === "commands")?.value).toBe("5");
  });

  it("should include branch only when available", () => {
    const withBranch = buildStatusItems(
      { workspace: "Review", operationCount: 5 },

      {
        cwd: "/repo",
        profiles: [],
        token: "token",
        branch: "main",
        repo: "owner/repo",
      },
    );

    const withoutBranch = buildStatusItems(
      { workspace: "Review", operationCount: 5 },
      { cwd: "/repo", repo: "owner/repo", token: "token", profiles: [] },
    );

    expect(withBranch.find((item) => item.label === "branch")?.value).toBe(
      "main",
    );

    expect(withoutBranch.find((item) => item.label === "branch")).toBe(
      undefined,
    );
  });

  it("should truncate long cwd values", () => {
    const cwd = formatCwd("/very/long/path/to/a/repository/root", 14);
    expect(cwd.length).toBeLessThanOrEqual(14);
    expect(cwd).toContain("…");
  });
});
