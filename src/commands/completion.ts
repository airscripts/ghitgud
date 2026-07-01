import { Command } from "commander";

import command from "@/core/command";
import completionService from "@/services/completion";

import type { Shell } from "@/services/completion";

const VALID_SHELLS = completionService.VALID_SHELLS;

const register = (program: Command) => {
  const completion = program
    .command("completion")
    .description("Generate shell completion scripts.");

  completion
    .command("generate")
    .description("Generate a shell completion script.")
    .requiredOption("--shell <shell>", `Shell type (${VALID_SHELLS.join("|")})`)
    .action(async (options) => {
      const shell = options.shell as Shell;
      const commands = program.commands
        .filter((c) => c.name() !== "completion")
        .map((c) => c.name());

      await command.run(() => completionService.getCompletion(shell, commands));
    });

  completion
    .command("list")
    .description("List supported shells.")
    .action(async () => {
      await command.run(() => completionService.listShells());
    });
};

export default { register };
