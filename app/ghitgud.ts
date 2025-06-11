import process from "process";
import { program } from "commander";

import ascii from "./ascii";
import commands from "./commands";

const NAME = "ghitgud";
const VERSION = "1.0.0";
const DESCRIPTION = "A simple CLI to give superpowers to GitHub.";

program
  .name(NAME)
  .description(DESCRIPTION)
  .version(VERSION);

commands();
program.addHelpText("before", ascii);
program.parse(process.argv);
