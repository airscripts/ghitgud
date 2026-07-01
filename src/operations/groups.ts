import type { Command } from "commander";

import { getOperationFamily } from "@/operations/registry";

export function commandGroup(
  program: Command,
  name: string,
  description: string,
): Command {
  const existing = program.commands.find((command) => command.name() === name);
  if (existing) return existing;
  const registeredDescription =
    getOperationFamily(name)?.description ?? description;
  return program.command(name).description(registeredDescription);
}
