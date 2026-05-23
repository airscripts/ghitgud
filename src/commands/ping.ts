import { Command } from "commander";

import command from "@/core/command";
import labelsService from "@/services/labels";

const register = (program: Command) => {
  program
    .command("ping")
    .description("Check if the CLI is working.")
    .action(() => void command.run(() => labelsService.ping()));
};

export default { register };
