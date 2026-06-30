import { Command } from "commander";

import command from "@/core/command";
import statusService from "@/services/status";

const register = (program: Command) => {
  program
    .command("status")
    .description("Show your work across GitHub repositories.")
    .option("--org <org>", "Limit results to an organization")
    .option("--exclude <repos>", "Comma-separated repositories to exclude")
    .action(async (options) => {
      await command.run(() =>
        statusService.status({
          org: options.org,
          exclude: options.exclude
            ?.split(",")
            .map((repo: string) => repo.trim())
            .filter(Boolean),
        }),
      );
    });
};

export default { register };
