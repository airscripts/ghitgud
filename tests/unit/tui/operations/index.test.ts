import { describe, it, expect } from "vitest";

import operations, { workspaces } from "@/tui/operations/index";

describe("tui operations index", () => {
  it("exports a non-empty operations array", () => {
    expect(Array.isArray(operations)).toBe(true);
    expect(operations.length).toBeGreaterThan(0);
  });

  it("every operation has required fields", () => {
    for (const op of operations) {
      expect(op.id).toBeTruthy();
      expect(op.title).toBeTruthy();
      expect(op.command).toBeTruthy();
      expect(op.description).toBeTruthy();
      expect(op.workspace).toBeTruthy();
      expect(typeof op.run).toBe("function");
    }
  });

  it("exports unique workspaces", () => {
    expect(Array.isArray(workspaces)).toBe(true);
    expect(workspaces.length).toBeGreaterThan(0);
    const uniqueWorkspaces = new Set(workspaces);
    expect(uniqueWorkspaces.size).toBe(workspaces.length);
  });

  it("all operation workspaces appear in workspaces list", () => {
    const workspaceSet = new Set(workspaces);
    for (const op of operations) {
      expect(workspaceSet.has(op.workspace)).toBe(true);
    }
  });
});
