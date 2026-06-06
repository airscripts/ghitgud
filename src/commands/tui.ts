import { Command } from "commander";

import tui from "@/tui";
import output from "@/core/output";
import command from "@/core/command";

const register = (program: Command) => {
  program
    .command("tui")
    .description("Launch the full-screen terminal UI.")
    .action(async () => {
      if (!process.stdin.isTTY) {
        output.writeError("TUI requires an interactive terminal.");
        process.exit(1);
      }

      await command.run(() => tui.start());
    });
};

export default { register };
