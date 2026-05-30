import { Command } from "commander";
import { EventEmitter } from "events";
import type { ChildProcess } from "child_process";
import { describe, it, expect, vi, beforeEach } from "vitest";

import output from "@/core/output";
import proxyCommand from "@/commands/proxy";

vi.mock("@/core/output", () => ({
  default: {
    writeError: vi.fn(),
  },
}));

function createChildProcess(): ChildProcess {
  return new EventEmitter() as ChildProcess;
}

describe("proxy command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it("registers proxy command on program", () => {
    const program = new Command();
    proxyCommand.register(program);

    const commands = program.commands.map((c) => c.name());
    expect(commands).toContain("proxy");
    expect(commands).not.toContain("gh");
  });

  it("forwards proxy args to gh", () => {
    const child = createChildProcess();
    const spawnGh = vi.fn(() => child);

    const handled = proxyCommand.runProxyFromArgv(
      ["node", "ghg", "proxy", "pr", "checkout", "17"],
      spawnGh,
    );

    expect(handled).toBe(true);
    expect(spawnGh).toHaveBeenCalledWith(["pr", "checkout", "17"]);
  });

  it("forwards proxy help to gh", () => {
    const child = createChildProcess();
    const spawnGh = vi.fn(() => child);

    const handled = proxyCommand.runProxyFromArgv(
      ["node", "ghg", "proxy", "--help"],
      spawnGh,
    );

    expect(handled).toBe(true);
    expect(spawnGh).toHaveBeenCalledWith(["--help"]);
  });

  it("allows known ghg global options before proxy", () => {
    const child = createChildProcess();
    const spawnGh = vi.fn(() => child);

    const handled = proxyCommand.runProxyFromArgv(
      ["node", "ghg", "--json", "--theme", "dark", "proxy", "status"],
      spawnGh,
    );

    expect(handled).toBe(true);
    expect(spawnGh).toHaveBeenCalledWith(["status"]);
  });

  it("runs bare gh when proxy has no args", () => {
    const child = createChildProcess();
    const spawnGh = vi.fn(() => child);

    const handled = proxyCommand.runProxyFromArgv(
      ["node", "ghg", "proxy"],
      spawnGh,
    );

    expect(handled).toBe(true);
    expect(spawnGh).toHaveBeenCalledWith([]);
  });

  it("does not handle non-proxy commands", () => {
    const spawnGh = vi.fn();

    const handled = proxyCommand.runProxyFromArgv(
      ["node", "ghg", "notifications", "list"],
      spawnGh,
    );

    expect(handled).toBe(false);
    expect(spawnGh).not.toHaveBeenCalled();
  });

  it("does not handle proxy after another command", () => {
    const spawnGh = vi.fn();

    const handled = proxyCommand.runProxyFromArgv(
      ["node", "ghg", "notifications", "proxy"],
      spawnGh,
    );

    expect(handled).toBe(false);
    expect(spawnGh).not.toHaveBeenCalled();
  });

  it("mirrors gh exit status", () => {
    const child = createChildProcess();
    const spawnGh = vi.fn(() => child);

    proxyCommand.runProxyFromArgv(["node", "ghg", "proxy", "status"], spawnGh);
    child.emit("exit", 42);

    expect(process.exitCode).toBe(42);
  });

  it("prints install hint when gh is missing", () => {
    const child = createChildProcess();
    const spawnGh = vi.fn(() => child);

    proxyCommand.runProxyFromArgv(["node", "ghg", "proxy", "status"], spawnGh);
    child.emit("error", { code: "ENOENT" });

    expect(output.writeError).toHaveBeenCalledWith(
      "gh CLI is not installed. Install it from https://cli.github.com.",
    );

    expect(process.exitCode).toBe(1);
  });
});
