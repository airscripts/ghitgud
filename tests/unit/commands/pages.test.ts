import { Command } from "commander";
import { describe, expect, it } from "vitest";

import pagesCommand from "@/commands/pages";

describe("pages command", () => {
  it("registers Pages subcommands", () => {
    const program = new Command();
    pagesCommand.register(program);
    const pages = program.commands.find((item) => item.name() === "pages");

    expect(pages?.commands.map((item) => item.name())).toEqual([
      "status",
      "deploy",
      "unpublish",
    ]);
  });
});
