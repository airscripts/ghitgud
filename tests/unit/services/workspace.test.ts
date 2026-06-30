import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import workspaceService from "@/services/workspace";

vi.mock("@/core/workspace", () => ({
  default: {
    define: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn() },
}));

vi.mock("@/core/errors", () => ({
  GhitgudError: class extends Error {},
}));

import workspaceConfig from "@/core/workspace";

describe("workspace service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defines a workspace", () => {
    (workspaceConfig.define as Mock).mockReturnValue({
      name: "my-team",
      repos: ["owner/repo1"],
    });
    const result = workspaceService.define("my-team", ["owner/repo1"]);
    expect(result.success).toBe(true);
    expect(workspaceConfig.define).toHaveBeenCalledWith("my-team", [
      "owner/repo1",
    ]);
  });

  it("throws on empty name", () => {
    expect(() => workspaceService.define("", ["owner/repo1"])).toThrow();
  });

  it("throws on empty repos", () => {
    expect(() => workspaceService.define("my-team", [])).toThrow();
  });

  it("lists workspaces", () => {
    (workspaceConfig.list as Mock).mockReturnValue([
      { name: "my-team", repos: ["owner/repo1"] },
    ]);
    const result = workspaceService.list();
    expect(result.success).toBe(true);
  });

  it("lists empty workspaces", () => {
    (workspaceConfig.list as Mock).mockReturnValue([]);
    const result = workspaceService.list();
    expect(result.success).toBe(true);
  });
});
