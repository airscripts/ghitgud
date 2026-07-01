import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import queueService from "@/services/queue";
import { commandGroup } from "@/operations/groups";

const register = (program: Command) => {
  const queue = commandGroup(
    program,
    "change",
    "Manage proposed changes for a repository.",
  )
    .command("queue")
    .description("Manage merge automation queues.");

  for (const action of ["list", "status"] as const) {
    queue
      .command(action)
      .description(
        `${action === "list" ? "List" : "Show status for"} the merge queue.`,
      )
      .option("--repo <repo>", "Repository (owner/repo)")
      .option("--branch <branch>", "Queue branch")
      .action(async (options) => {
        const repo = await repoResolver.resolveRepo(options.repo);
        await command.run(
          async (): Promise<unknown> => queueService[action](repo, options),
        );
      });
  }

  for (const action of ["add", "remove"] as const) {
    queue
      .command(`${action} <pr>`)
      .description(
        `${action === "add" ? "Add a pull request to" : "Remove a pull request from"} the merge queue.`,
      )
      .option("--repo <repo>", "Repository (owner/repo)")
      .action(async (pr: string, options) => {
        const repo = await repoResolver.resolveRepo(options.repo);
        await command.run(() =>
          queueService[action](
            repo,
            parse.parsePositiveInt(pr, "pull request"),
          ),
        );
      });
  }

  queue
    .command("history")
    .description("Show recent merge queue activity.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--branch <branch>", "Queue branch")
    .option("--limit <n>", "Maximum events", "20")
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() =>
        queueService.history(repo, {
          branch: options.branch,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });
};

export default { register };
