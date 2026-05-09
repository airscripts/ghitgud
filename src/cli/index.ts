import process from "process";
import { program } from "commander";

import ascii from "./ascii";
import pingCommand from "@/commands/ping";
import labelsCommand from "@/commands/labels";
import configCommand from "@/commands/config";
import format from "@/core/format";
import { GhitgudError } from "@/core/errors";

const NAME = "ghitgud";
const DESCRIPTION = "A simple CLI to give superpowers to GitHub.";

program
  .name(NAME)
  .description(DESCRIPTION)
  .version(__VERSION__);

pingCommand.register(program);
labelsCommand.register(program);
configCommand.register(program);

program.addHelpText("before", ascii);

try {
  program.parse(process.argv);
} catch (error) {
  if (error instanceof GhitgudError) {
    format.formatError(error.message);
    process.exit(1);
  }
  throw error;
}