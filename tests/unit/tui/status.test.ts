import { describe, it, expect } from "vitest";

import { buildStatusItems, getActiveProfile } from "@/tui/status";

describe("tui status", () => {
  it("should show token set state", () => {
    const items = buildStatusItems(
      { workspace: "Dashboard" },

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

  it("should show none for missing token and repo", () => {
    const items = buildStatusItems(
      { workspace: "Dashboard" },

      {
        cwd: "/repo",
        repo: null,
        token: null,
        profiles: [],
      },
    );

    expect(items.find((item) => item.label === "token")).toMatchObject({
      tone: "danger",
      value: "none",
    });

    expect(items.find((item) => item.label === "repo")).toMatchObject({
      value: "none",
    });
  });

  it("should use the active profile or none fallback", () => {
    expect(
      getActiveProfile([
        { name: "default", active: false },
        { name: "work", active: true },
      ]),
    ).toBe("work");

    expect(getActiveProfile([])).toBe(null);
  });

  it("should include workspace", () => {
    const items = buildStatusItems(
      { workspace: "Review" },
      { cwd: "/repo", repo: "owner/repo", token: "token", profiles: [] },
    );

    expect(items.find((item) => item.label === "workspace")?.value).toBe(
      "Review",
    );
  });

  it("should include branch only when available", () => {
    const withBranch = buildStatusItems(
      { workspace: "Review" },

      {
        cwd: "/repo",
        profiles: [],
        token: "token",
        branch: "main",
        repo: "owner/repo",
      },
    );

    const withoutBranch = buildStatusItems(
      { workspace: "Review" },
      { cwd: "/repo", repo: "owner/repo", token: "token", profiles: [] },
    );

    expect(withBranch.find((item) => item.label === "branch")?.value).toBe(
      "main",
    );

    expect(withoutBranch.find((item) => item.label === "branch")).toBe(
      undefined,
    );
  });

  it("should show folder name for cwd", () => {
    const items = buildStatusItems(
      { workspace: "Review" },
      { cwd: "/very/long/path/to/a/repository/root" },
    );

    expect(items.find((item) => item.label === "cwd")?.value).toBe("root");
  });
});
