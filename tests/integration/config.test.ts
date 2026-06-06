import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import configCommand from "@/commands/config";

vi.mock("@/services/config", () => ({
  default: {
    read: vi.fn(() => "airscripts/ghitgud"),
    set: vi.fn(() => Promise.resolve({ success: true })),
    unset: vi.fn(() => Promise.resolve({ success: true })),

    get: vi.fn(() =>
      Promise.resolve({ success: true, value: "airscripts/ghitgud" }),
    ),
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
      "repo",
      "airscripts/ghitgud",
    ]);

    expect(configService.set).toHaveBeenCalledWith(
      "repo",
      "airscripts/ghitgud",
    );
  });

  it("get calls service.get with key", async () => {
    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "get", "repo"]);
    expect(configService.get).toHaveBeenCalledWith("repo");
  });

  it("unset calls service.unset with key", async () => {
    const program = new Command();
    program.exitOverride();
    configCommand.register(program);

    await program.parseAsync(["node", "test", "config", "unset", "repo"]);
    expect(configService.unset).toHaveBeenCalledWith("repo");
  });
});
