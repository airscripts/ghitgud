import { Command } from "commander";
import { describe, expect, it } from "vitest";

import operations from "@/tui/operations";
import { registerOperations } from "@/operations/register";
import { operationFamilies } from "@/operations/registry";

function registeredFamilies(): string[] {
  const program = new Command();
  registerOperations(program);
  program.command("version");
  return program.commands.map((command) => command.name()).sort();
}

describe("operation surface parity", () => {
  it("registers every public operation family exactly once", () => {
    const expected = operationFamilies.map((family) => family.name).sort();
    expect(registeredFamilies()).toEqual(expected);
  });

  it("uses only registered canonical families in the TUI", () => {
    const registered = new Set(registeredFamilies());

    for (const operation of operations) {
      const [, family] = operation.command.split(/\s+/);
      expect(registered.has(family), operation.command).toBe(true);
      expect(operation.workspace).toBe(family);
    }
  });

  it("does not restore legacy public families", () => {
    expect(registeredFamilies()).not.toEqual(
      expect.arrayContaining([
        "gh",
        "ghg",
        "pr",
        "project",
        "gist",
        "pages",
        "codespace",
        "copilot",
        "extension",
      ]),
    );
  });

  it("shows help for nested commands", async () => {
    const program = new Command();
    const output: string[] = [];
    program.configureOutput({ writeOut: (value) => output.push(value) });
    registerOperations(program);

    await program.parseAsync(["node", "gitfleet", "help", "pipeline", "run"]);

    expect(output.join("")).toContain("Usage: gitfleet pipeline run");
  });

  it("rejects unknown help paths", async () => {
    const program = new Command();
    registerOperations(program);

    await expect(
      program.parseAsync(["node", "gitfleet", "help", "missing"]),
    ).rejects.toThrow("Unknown command path: missing.");
  });
});
