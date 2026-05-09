import process from "process";
import { program } from "commander";

import ascii from "./ascii";
import logger from "@/core/logger";
import ghCommand from "@/commands/gh";
import pingCommand from "@/commands/ping";
import labelsCommand from "@/commands/labels";
import configCommand from "@/commands/config";
import { GhitgudError } from "@/core/errors";

const NAME = "ghitgud";
const DESCRIPTION = "A simple CLI to give superpowers to GitHub.";

program.name(NAME).description(DESCRIPTION).version(__VERSION__);

ghCommand.register(program);
pingCommand.register(program);
labelsCommand.register(program);
configCommand.register(program);

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
