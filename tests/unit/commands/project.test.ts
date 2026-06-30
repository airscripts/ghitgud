import { Command } from "commander";
import { describe, expect, it } from "vitest";

import projectCommand from "@/commands/project";

describe("project command", () => {
  it("registers project board command", () => {
    const program = new Command();
    projectCommand.register(program);

    const project = program.commands.find(
      (command) => command.name() === "project",
    );

    expect(project).toBeDefined();
    expect(project!.commands.map((command) => command.name())).toContain(
      "board",
    );
    expect(project!.commands.map((command) => command.name())).toEqual(
      expect.arrayContaining([
        "list",
        "view",
        "create",
        "edit",
        "close",
        "delete",
        "item-list",
        "item-add",
        "item-create",
        "field-list",
        "link",
        "unlink",
      ]),
    );
  });
});
