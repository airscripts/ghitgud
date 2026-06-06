import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import workflowCommand from "@/commands/workflow";

vi.mock("@/services/workflow", () => ({
  default: {
    preview: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    validate: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import workflowService from "@/services/workflow";

describe("integration > workflow commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validate calls service with optional path", async () => {
    const program = new Command();
    program.exitOverride();
    workflowCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "workflow",
      "validate",
      ".github/workflows/ci.yml",
    ]);

    expect(workflowService.validate).toHaveBeenCalledWith(
      ".github/workflows/ci.yml",
    );
  });

  it("validate calls service without path", async () => {
    const program = new Command();
    program.exitOverride();
    workflowCommand.register(program);

    await program.parseAsync(["node", "test", "workflow", "validate"]);
    expect(workflowService.validate).toHaveBeenCalledWith(undefined);
  });

  it("preview calls service with optional path", async () => {
    const program = new Command();
    program.exitOverride();
    workflowCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "workflow",
      "preview",
      ".github/workflows/ci.yml",
    ]);

    expect(workflowService.preview).toHaveBeenCalledWith(
      ".github/workflows/ci.yml",
    );
  });
});
