import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import configCommand from "@/commands/config";

vi.mock("@/services/config", () => ({
  default: {
    set: vi.fn(() => Promise.resolve({ success: true })),

    get: vi.fn(() =>
      Promise.resolve({ success: true, value: "ghp_testtoken" }),
    ),

    unset: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

import configService from "@/services/config";

describe("integration > config commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("set calls service.set with key and value", async () => {
    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "config",
      "set",
      "token",
      "ghp_testtoken",
    ]);

    expect(configService.set).toHaveBeenCalledWith("token", "ghp_testtoken");
  });

  it("get calls service.get with key", async () => {
    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "get", "token"]);
    expect(configService.get).toHaveBeenCalledWith("token");
  });

  it("unset calls service.unset with key", async () => {
    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "unset", "token"]);
    expect(configService.unset).toHaveBeenCalledWith("token");
  });
});
