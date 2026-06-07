import { describe, it, expect } from "vitest";

import { buildStatusItems, getActiveProfile } from "@/tui/status";

describe("tui status", () => {
  it("should show token set state", () => {
    const items = buildStatusItems(
      { mode: "normal" },

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
      { mode: "normal" },

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
      tone: "danger",
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

  it("should include mode", () => {
    const items = buildStatusItems(
      { mode: "visual" },
      { cwd: "/repo", repo: "owner/repo", token: "token", profiles: [] },
    );

    expect(items.find((item) => item.label === "mode")?.value).toBe("visual");
  });

  it("should include branch only when available", () => {
    const withBranch = buildStatusItems(
      { mode: "normal" },

      {
        cwd: "/repo",
        profiles: [],
        token: "token",
        branch: "main",
        repo: "owner/repo",
      },
    );

    const withoutBranch = buildStatusItems(
      { mode: "normal" },
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
      { mode: "normal" },
      { cwd: "/very/long/path/to/a/repository/root" },
    );

    expect(items.find((item) => item.label === "cwd")?.value).toBe("root");
  });

  it("should order items as token, repo, profile, cwd, branch, mode", () => {
    const items = buildStatusItems(
      { mode: "normal" },

      {
        cwd: "/repo",
        token: "ghp_test",
        repo: "owner/repo",
        branch: "main",
        profiles: [{ name: "work", active: true }],
      },
    );

    const labels = items.map((item) => item.label);
    expect(labels).toEqual([
      "token",
      "repo",
      "profile",
      "cwd",
      "branch",
      "mode",
    ]);
  });
});
