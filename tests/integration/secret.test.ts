import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import secretCommand from "@/commands/secret";

vi.mock("@/services/secrets", () => ({
  default: {
    set: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    list: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
    remove: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import secretsService from "@/services/secrets";

describe("integration > secret commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls service with env and org", async () => {
    const program = new Command();
    program.exitOverride();
    secretCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "secret",
      "list",
      "--env",
      "staging",
      "--org",
      "airscripts",
    ]);

    expect(secretsService.list).toHaveBeenCalledWith({
      env: "staging",
      org: "airscripts",
    });
  });

  it("set calls service with all options", async () => {
    const program = new Command();
    program.exitOverride();
    secretCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "secret",
      "set",
      "--name",
      "API_KEY",
      "--value",
      "secret123",
      "--env",
      "staging",
      "--org",
      "airscripts",
      "--visibility",
      "selected",
      "--repos",
      "airscripts/ghitgud",
    ]);

    expect(secretsService.set).toHaveBeenCalledWith({
      name: "API_KEY",
      env: "staging",
      org: "airscripts",
      value: "secret123",
      visibility: "selected",
      repos: "airscripts/ghitgud",
    });
  });

  it("delete calls service with name and env", async () => {
    const program = new Command();
    program.exitOverride();
    secretCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "secret",
      "delete",
      "--name",
      "API_KEY",
      "--env",
      "staging",
    ]);

    expect(secretsService.remove).toHaveBeenCalledWith({
      name: "API_KEY",
      env: "staging",
    });
  });
});
