import { Command } from "commander";
import { describe, it, expect, vi } from "vitest";

import gistCommand from "@/commands/gist";

vi.mock("@/services/gist", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    edit: vi.fn(),
    clone: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    fork: vi.fn(),
    star: vi.fn(),
    unstar: vi.fn(),
    comment: vi.fn(),
  },
}));

describe("gist command", () => {
  it("registers the complete gist lifecycle", () => {
    const program = new Command();
    gistCommand.register(program);
    const gist = program.commands.find((item) => item.name() === "gist");
    expect(gist?.commands.map((item) => item.name())).toEqual([
      "list",
      "view",
      "create",
      "edit",
      "delete",
      "clone",
      "fork",
      "star",
      "unstar",
      "comment",
    ]);
  });
});
