import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import environmentCommand from "@/commands/environment";

vi.mock("@/services/environments", () => ({
  default: {
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    create: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),

    listProtectionRules: vi.fn(() =>
      Promise.resolve({ success: true, metadata: [] }),
    ),

    addProtectionRule: vi.fn(() =>
      Promise.resolve({ success: true, metadata: {} }),
    ),

    removeProtectionRule: vi.fn(() =>
      Promise.resolve({ success: true, metadata: {} }),
    ),
  },
}));

import environmentsService from "@/services/environments";

describe("integration > environment commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls service.list", async () => {
    const program = new Command();
    program.exitOverride();
    environmentCommand.register(program);

    await program.parseAsync(["node", "test", "environment", "list"]);
    expect(environmentsService.list).toHaveBeenCalledTimes(1);
  });

  it("create calls service.create with name and wait timer", async () => {
    const program = new Command();
    program.exitOverride();
    environmentCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "environment",
      "create",
      "--name",
      "staging",
      "--wait-timer",
      "30",
    ]);

    expect(environmentsService.create).toHaveBeenCalledWith({
      name: "staging",
      waitTimer: 30,
    });
  });

  it("protection list calls service with env name", async () => {
    const program = new Command();
    program.exitOverride();
    environmentCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "environment",
      "protection",
      "list",
      "--env",
      "staging",
    ]);

    expect(environmentsService.listProtectionRules).toHaveBeenCalledWith(
      "staging",
    );
  });

  it("protection add calls service with env, type, and parsed value", async () => {
    const program = new Command();
    program.exitOverride();
    environmentCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "environment",
      "protection",
      "add",
      "--env",
      "staging",
      "--type",
      "wait_timer",
      "--value",
      '{"timer": 30}',
    ]);

    expect(environmentsService.addProtectionRule).toHaveBeenCalledWith({
      env: "staging",
      type: "wait_timer",
      value: { timer: 30 },
    });
  });

  it("protection remove calls service with env and ruleId", async () => {
    const program = new Command();
    program.exitOverride();
    environmentCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "environment",
      "protection",
      "remove",
      "--env",
      "staging",
      "--rule-id",
      "42",
    ]);

    expect(environmentsService.removeProtectionRule).toHaveBeenCalledWith({
      env: "staging",
      ruleId: 42,
    });
  });
});
