import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import runService from "@/services/run";
import { GhitgudError } from "@/core/errors";
import { ERROR_RUN_ID_REQUIRED } from "@/core/constants";

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
        if (!runId) {
          throw new GhitgudError(ERROR_RUN_ID_REQUIRED);
        }

        const parsedRunId = parse.parsePositiveInt(runId, "run id");
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          runService.debugRun(parsedRunId, {
            ...options,
            repo,
          }),
        );
      },
    );
};

export default { register };
