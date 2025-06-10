import process from "process";
import { program } from "commander";

import ascii from "./ascii";
import library from "./library";
import "dotenv/config";

program
  .name("ghitgud")
  .description("A simple CLI to give superpowers to GitHub.")
  .version("0.1.0");

program
  .command("ping")
  .description("Check if the CLI is working.")
  .action(() => library.ping());

program.addHelpText("before", ascii);
program.parse(process.argv);
