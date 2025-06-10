import process from "process";
import { program } from "commander";
import ascii from "./app/ascii";

program.version("0.1.0");
program.parse(process.argv);
console.info(ascii);
