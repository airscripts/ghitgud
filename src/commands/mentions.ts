import { Command } from "commander";

import command from "@/core/command";
import service from "@/services/notifications";

const register = (program: Command) => {
  program
    .command("mentions")
    .description("Find recent @mentions of you.")
    .action(() => void command.run(() => service.mentions()));
};

export default { register };
