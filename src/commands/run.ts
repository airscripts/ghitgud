import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import runService from "@/services/run";

const register = (program: Command) => {
  const run = program
    .command("run")
    .description("Inspect and debug workflow runs.");

  run
    .command("debug")
    .description("Fetch logs, artifacts, and annotations for a run.")
    .argument("[run-id]", "Workflow run id")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--output-dir <path>", "Output directory for debug bundle")
    .action(
      async (
        runId: string | undefined,
        options: { repo?: string; outputDir?: string },
      ) => {
        const value =
          runId ??
          (await prompt.text("Enter workflow run id:", {
            placeholder: "123456",
          }));

        await command.run(() =>
          runService.debugRun(parseInt(value, 10), options),
        );
      },
    );
};

export default { register };
