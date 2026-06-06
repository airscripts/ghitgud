import { Command } from "commander";

import command from "@/core/command";
import service from "@/services/notifications";

const register = (program: Command) => {
  program
    .command("activity")
    .description("Show assigned issues, review requests, and mentions.")
    .action(async () => {
      await command.run(() => service.activity());
    });
};

export default { register };
