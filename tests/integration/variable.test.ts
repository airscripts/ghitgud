import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import variableCommand from "@/commands/variable";

vi.mock("@/services/variables", () => ({
  default: {
    set: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    remove: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import variablesService from "@/services/variables";

describe("integration > variable commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls service with env and org", async () => {
    const program = new Command();
    program.exitOverride();
    variableCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "variable",
      "list",
      "--env",
      "staging",
      "--org",
      "airscripts",
    ]);

    expect(variablesService.list).toHaveBeenCalledWith({
      env: "staging",
      org: "airscripts",
    });
  });

  it("set calls service with name, value, env, and org", async () => {
    const program = new Command();
    program.exitOverride();
    variableCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "variable",
      "set",
      "--name",
      "NODE_VERSION",
      "--value",
      "20",
      "--env",
      "staging",
      "--org",
      "airscripts",
    ]);

    expect(variablesService.set).toHaveBeenCalledWith({
      value: "20",
      env: "staging",
      org: "airscripts",
      name: "NODE_VERSION",
    });
  });

  it("delete calls service with name and org", async () => {
    const program = new Command();
    program.exitOverride();
    variableCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "variable",
      "delete",
      "--name",
      "NODE_VERSION",
      "--org",
      "airscripts",
    ]);

    expect(variablesService.remove).toHaveBeenCalledWith({
      org: "airscripts",
      name: "NODE_VERSION",
    });
  });
});
