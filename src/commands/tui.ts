import { Command } from "commander";

import tui from "@/tui";
import command from "@/core/command";

const register = (program: Command) => {
  program
    .command("tui")
    .description("Launch the full-screen terminal UI.")
    .action(async () => {
      await command.run(() => tui.start());
    });
};

export default { register };
