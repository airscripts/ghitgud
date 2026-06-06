import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import projectCommand from "@/commands/project";

vi.mock("@/services/project", () => ({
  default: {
    board: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import projectService from "@/services/project";

describe("integration > project commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("board calls service with id and owner", async () => {
    const program = new Command();
    program.exitOverride();
    projectCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "project",
      "board",
      "42",
      "--owner",
      "airscripts",
    ]);

    expect(projectService.board).toHaveBeenCalledWith("42", {
      owner: "airscripts",
    });
  });
});
