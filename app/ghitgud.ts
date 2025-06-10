import process from "process";
import { program } from "commander";

import ascii from "./ascii";
import library from "./library";

program
  .name("ghitgud")
  .description("A simple CLI to give superpowers to GitHub.")
  .version("0.1.0");

program
  .command("foo")
  .description("foo")
  .action(() => library.foo());

program.addHelpText("before", ascii);
program.parse(process.argv);
