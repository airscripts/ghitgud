import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import labelsCommand from "@/commands/labels";

vi.mock("@/services/labels", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    pull: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),

    push: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    prune: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    pullTemplate: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    pushTemplate: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import labelsService from "@/services/labels";

describe("integration > labels commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls service.list", async () => {
    const program = new Command();
    program.exitOverride();
    labelsCommand.register(program);

    await program.parseAsync(["node", "test", "labels", "list"]);
    expect(labelsService.list).toHaveBeenCalledTimes(1);
  });

  it("pull calls service.pull", async () => {
    const program = new Command();
    program.exitOverride();
    labelsCommand.register(program);

    await program.parseAsync(["node", "test", "labels", "pull"]);
    expect(labelsService.pull).toHaveBeenCalledTimes(1);
  });

  it("pull with template calls service.pullTemplate", async () => {
    const program = new Command();
    program.exitOverride();
    labelsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "labels",
      "pull",
      "-t",
      "conventional",
    ]);

    expect(labelsService.pullTemplate).toHaveBeenCalled();
  });

  it("push calls service.push", async () => {
    const program = new Command();
    program.exitOverride();
    labelsCommand.register(program);

    await program.parseAsync(["node", "test", "labels", "push"]);
    expect(labelsService.push).toHaveBeenCalledTimes(1);
  });

  it("push with template calls service.pushTemplate", async () => {
    const program = new Command();
    program.exitOverride();
    labelsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "labels",
      "push",
      "-t",
      "github",
    ]);

    expect(labelsService.pushTemplate).toHaveBeenCalled();
  });

  it("prune calls service.prune", async () => {
    const program = new Command();
    program.exitOverride();
    labelsCommand.register(program);

    await program.parseAsync(["node", "test", "labels", "prune"]);
    expect(labelsService.prune).toHaveBeenCalledTimes(1);
  });
});
