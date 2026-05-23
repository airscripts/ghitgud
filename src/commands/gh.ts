import process from "process";
import { Command } from "commander";
import { spawn } from "child_process";

import output from "@/core/output";

const register = (program: Command) => {
  program
    .command("gh")
    .description("Pass through to the gh CLI. Usage: ghitgud gh <args>")
    .allowUnknownOption()
    .action((_opts, command) => {
      const args = command.args;

      const child = spawn("gh", args, {
        stdio: "inherit",
        shell: false,
      });

      child.on("error", (error: { code?: string }) => {
        if (error.code === "ENOENT") {
          output.writeError(
            "gh CLI is not installed. " +
              "Install it from https://cli.github.com.",
          );

          process.exit(1);
        }

        output.writeError(String(error));
        process.exit(1);
      });

      child.on("exit", (code) => {
        process.exitCode = code ?? 0;
      });
    });
};

export default { register };
