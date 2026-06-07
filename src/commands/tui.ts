import { Command } from "commander";

import tui from "@/tui";
import command from "@/core/command";
import { GhitgudError } from "@/core/errors";

const register = (program: Command) => {
  program
    .command("tui")
    .description("Launch the full-screen terminal UI.")
    .action(async () => {
      if (!process.stdin.isTTY) {
        throw new GhitgudError("TUI requires an interactive terminal.");
      }

      await command.run(() => tui.start());
    });
};

export default { register };
