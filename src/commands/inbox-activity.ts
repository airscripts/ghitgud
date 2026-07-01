import { Command } from "commander";

import command from "@/core/command";
import repoResolver from "@/core/repo";
import service from "@/services/notifications";
import { commandGroup } from "@/operations/groups";

const register = (program: Command) => {
  commandGroup(
    program,
    "inbox",
    "Manage notifications, activity, mentions, and review requests.",
  )
    .command("activity")
    .description("Show assigned issues, review requests, and mentions.")
    .option("--repo <repo>", "Filter by repository")
    .action(async (options: { repo?: string }) => {
      const repo = options.repo
        ? await repoResolver.resolveRepo(options.repo)
        : undefined;

      await command.run(() => service.activity(repo));
    });
};

export default { register };
