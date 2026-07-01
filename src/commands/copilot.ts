import { Command } from "commander";

import command from "@/core/command";
import copilotService from "@/services/copilot";

const register = (program: Command) => {
  program
    .command("copilot")
    .description("Run GitHub Copilot CLI.")
    .allowUnknownOption(true)
    .arguments("[args...]")
    .action(async (args: string[]) => {
      await command.run(() => copilotService.run(args ?? []));
    });
};

export default { register };
