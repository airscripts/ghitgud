import process from "process";
import { program } from "commander";

import ascii from "./ascii";
import logger from "@/core/logger";
import ghCommand from "@/commands/gh";
import prCommand from "@/commands/pr";
import pingCommand from "@/commands/ping";
import reposCommand from "@/commands/repos";
import labelsCommand from "@/commands/labels";
import configCommand from "@/commands/config";
import profileCommand from "@/commands/profile";
import insightsCommand from "@/commands/insights";
import mentionsCommand from "@/commands/mentions";
import { ERROR_NO_TOKEN } from "@/core/constants";
import activityCommand from "@/commands/activity";
import notificationsCommand from "@/commands/notifications";

import {
  GhitgudError,
  RateLimitError,
  TokenRequiredError,
} from "@/core/errors";

const NAME = "ghitgud";
const DESCRIPTION = "A simple CLI to give superpowers to GitHub.";

program.name(NAME).description(DESCRIPTION).version(__VERSION__);

ghCommand.register(program);
notificationsCommand.register(program);
activityCommand.register(program);
mentionsCommand.register(program);
reposCommand.register(program);
insightsCommand.register(program);
pingCommand.register(program);
labelsCommand.register(program);
profileCommand.register(program);
configCommand.register(program);
prCommand.register(program);

program.addHelpText("before", ascii);
program.exitOverride();

function handleError(error: unknown): never {
  if (error instanceof TokenRequiredError) {
    logger.error(error.message);
    logger.info(ERROR_NO_TOKEN);
    process.exit(1);
  }

  if (error instanceof RateLimitError) {
    logger.error(error.message);
    process.exit(1);
  }

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

try {
  program.parse(process.argv);
} catch (error) {
  handleError(error);
}

process.on("unhandledRejection", (error: unknown) => {
  handleError(error);
});
