import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";

import apiCommand from "@/commands/api";
import queueCommand from "@/commands/queue";
import statusCommand from "@/commands/status";
import rulesetCommand from "@/commands/ruleset";

vi.mock("@/services/api", () => ({ default: { request: vi.fn() } }));
vi.mock("@/services/status", () => ({ default: { status: vi.fn() } }));
vi.mock("@/services/ruleset", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    check: vi.fn(),
    create: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
    validate: vi.fn(),
  },
}));
vi.mock("@/services/queue", () => ({
  default: {
    list: vi.fn(),
    status: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    history: vi.fn(),
  },
}));

describe("next roadmap commands", () => {
  it("registers api and status commands", () => {
    const program = new Command();
    apiCommand.register(program);
    statusCommand.register(program);
    expect(program.commands.map((command) => command.name())).toEqual([
      "api",
      "status",
    ]);
  });

  it("registers ruleset lifecycle commands", () => {
    const program = new Command();
    rulesetCommand.register(program);
    const ruleset = program.commands[0];
    expect(ruleset.commands.map((command) => command.name())).toEqual([
      "list",
      "view",
      "check",
      "create",
      "edit",
      "delete",
      "validate",
    ]);
  });

  it("registers merge queue commands", () => {
    const program = new Command();
    queueCommand.register(program);
    expect(
      program.commands[0].commands.map((command) => command.name()),
    ).toEqual(["list", "status", "add", "remove", "history"]);
  });
});
