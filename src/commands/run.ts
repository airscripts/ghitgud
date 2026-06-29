import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import runService from "@/services/run";
import { GhitgudError } from "@/core/errors";
import { ERROR_RUN_ID_REQUIRED } from "@/core/constants";

const register = (program: Command) => {
  const run = program
    .command("run")
    .description("Inspect and debug workflow runs.");

  const resolve = async (value: string, repo?: string) => ({
    runId: parse.parsePositiveInt(value, "run id"),
    repo: await repoResolver.resolveRepo(repo),
  });

  run
    .command("list")
    .description("List workflow runs.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--workflow <name>", "Workflow name or id")
    .option("--branch <name>", "Branch name")
    .option("--status <status>", "Run status")
    .option("--limit <n>", "Maximum runs", "30")
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        runService.list({
          ...options,
          repo,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  run
    .command("view <run-id>")
    .description("View a workflow run.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (value: string, options) => {
      const target = await resolve(value, options.repo);
      await command.run(() => runService.view(target.runId, target.repo));
    });

  run
    .command("cancel <run-id>")
    .description("Cancel a workflow run.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (value: string, options) => {
      const target = await resolve(value, options.repo);
      await command.run(() => runService.cancel(target.runId, target.repo));
    });

  run
    .command("rerun <run-id>")
    .description("Rerun a workflow run.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--failed-jobs", "Rerun failed jobs only")
    .action(async (value: string, options) => {
      const target = await resolve(value, options.repo);

      await command.run(() =>
        runService.rerun(target.runId, target.repo, options.failedJobs),
      );
    });

  run
    .command("delete <run-id>")
    .description("Delete a workflow run.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--yes", "Confirm deletion", false)
    .action(async (value: string, options) => {
      const target = await resolve(value, options.repo);

      if (!options.yes) {
        prompt.guardNonInteractive("Workflow run deletion requires --yes.");

        if (!(await prompt.confirm(`Delete workflow run ${target.runId}?`)))
          return;
      }

      await command.run(() => runService.remove(target.runId, target.repo));
    });

  run
    .command("watch <run-id>")
    .description("Watch a workflow run until completion.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--tail", "Reserved for live log output")
    .option("--filter <pattern>", "Reserved log filter")
    .action(async (value: string, options) => {
      const target = await resolve(value, options.repo);
      await command.run(() => runService.watch(target.runId, target.repo));
    });

  run
    .command("download <run-id>")
    .description("Download workflow run artifacts.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--pattern <glob>", "Artifact name pattern")
    .option("--output-dir <dir>", "Download directory")
    .action(async (value: string, options) => {
      const target = await resolve(value, options.repo);

      await command.run(() =>
        runService.download(target.runId, { ...options, repo: target.repo }),
      );
    });

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
