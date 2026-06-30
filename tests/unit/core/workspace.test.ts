import { describe, expect, it, vi, beforeEach } from "vitest";
import workspaceConfig from "@/core/workspace";
import fs from "fs";

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue("[]"),
    writeFileSync: vi.fn(),
  },
}));

vi.mock("os", () => ({
  default: { homedir: vi.fn().mockReturnValue("/home/testuser") },
}));

describe("workspace config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defines a workspace", () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue("[]");
    const result = workspaceConfig.define("my-team", [
      "owner/repo1",
      "owner/repo2",
    ]);
    expect(result.name).toBe("my-team");
    expect(result.repos).toEqual(["owner/repo1", "owner/repo2"]);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it("lists workspaces", () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify([{ name: "my-team", repos: ["owner/repo1"] }]),
    );
    const result = workspaceConfig.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("my-team");
  });

  it("gets a workspace", () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify([{ name: "my-team", repos: ["owner/repo1"] }]),
    );
    const result = workspaceConfig.get("my-team");
    expect(result.name).toBe("my-team");
  });

  it("throws when workspace not found", () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue("[]");
    expect(() => workspaceConfig.get("missing")).toThrow("not found");
  });

  it("removes a workspace", () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify([{ name: "my-team", repos: ["owner/repo1"] }]),
    );
    workspaceConfig.remove("my-team");
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it("throws when removing non-existent workspace", () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue("[]");
    expect(() => workspaceConfig.remove("missing")).toThrow("not found");
  });

  it("updates existing workspace on define", () => {
    (fs.readFileSync as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify([{ name: "my-team", repos: ["owner/repo1"] }]),
    );
    const result = workspaceConfig.define("my-team", [
      "owner/repo1",
      "owner/repo2",
    ]);
    expect(result.repos).toEqual(["owner/repo1", "owner/repo2"]);
  });
});
