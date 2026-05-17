import process from "process";
import { program } from "commander";

import ascii from "./ascii";
import logger from "@/core/logger";
import ghCommand from "@/commands/gh";
import prCommand from "@/commands/pr";
import pingCommand from "@/commands/ping";
import { GhitgudError } from "@/core/errors";
import labelsCommand from "@/commands/labels";
import configCommand from "@/commands/config";
import mentionsCommand from "@/commands/mentions";
import activityCommand from "@/commands/activity";
import notificationsCommand from "@/commands/notifications";

const NAME = "ghitgud";
const DESCRIPTION = "A simple CLI to give superpowers to GitHub.";

program.name(NAME).description(DESCRIPTION).version(__VERSION__);

ghCommand.register(program);
notificationsCommand.register(program);
activityCommand.register(program);
mentionsCommand.register(program);
pingCommand.register(program);
labelsCommand.register(program);
configCommand.register(program);
prCommand.register(program);

program.addHelpText("before", ascii);
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error) {
  if (error instanceof GhitgudError) {
    logger.error(error.message);
    process.exit(1);
  }

  const commanderError = error as { code?: string; exitCode?: number };
  if (commanderError.exitCode === 0) {
    process.exit(0);
  }

  throw error;
}

process.on("unhandledRejection", (error: unknown) => {
  if (error instanceof GhitgudError) {
    logger.error((error as GhitgudError).message);
    process.exit(1);
  }

  throw error;
});
