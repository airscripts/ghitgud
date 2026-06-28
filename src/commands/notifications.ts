import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import service from "@/services/notifications";
import reposService from "@/services/repos/index";

const addTargetOptions = (cmd: Command) => {
  return cmd
    .option("--org <org>", "Target all repositories in an organization")
    .option("--repos <repos>", "Comma-separated owner/repo list")
    .option("--file <path>", "JSON or text file containing repositories");
};

const register = (program: Command) => {
  const notifications = program
    .command("notifications")
    .description("Manage GitHub notifications.");

  notifications.addHelpText(
    "after",
    `
Examples:
  ghg notifications list
  ghg notifications list --repo owner/repo
  ghg notifications list --org my-org
  ghg notifications read 12345
`,
  );

  notifications
    .command("list")
    .description("List notifications.")
    .option("-a, --all", "Include read notifications")
    .option("-p, --participating", "Only participating notifications")
    .option("-r, --repo <owner/repo>", "Filter by repository")
    .option("-l, --limit <n>", "Max results")
    .action(async (options) => {
      const repo = options.repo
        ? await repoResolver.resolveRepo(options.repo)
        : undefined;

      await command.run(() =>
        service.list({
          repo,
          all: options.all,
          participating: options.participating,

          limit: options.limit
            ? parse.parsePositiveInt(options.limit, "limit")
            : undefined,
        }),
      );
    });

  addTargetOptions(
    notifications
      .command("list-by-target")
      .description(
        "List notifications for a set of repositories (org, repos list, or file).",
      )
      .addHelpText(
        "after",
        `
Examples:
  ghg notifications list-by-target --org my-org
  ghg notifications list-by-target --repos owner/repo1,owner/repo2
`,
      ),
  )
    .option("-a, --all", "Include read notifications")
    .option("-p, --participating", "Only participating notifications")
    .action(async (options) => {
      const targets = {
        org: options.org,
        file: options.file,
        repos: options.repos,
      };

      const repoSummaries = await reposService.resolveTargets(targets);
      const repos = repoSummaries.map((r) => r.fullName);

      await command.run(() =>
        service.list({
          repos,
          all: options.all,
          participating: options.participating,
        }),
      );
    });

  notifications
    .command("read")
    .description("Mark a notification as read.")
    .arguments("[id]")
    .action(async (id?: string) => {
      let notificationId = id;

      if (!notificationId) {
        prompt.guardNonInteractive("Notification ID is required.");

        notificationId = await prompt.text(
          "Enter the notification ID to mark as read:",
          { placeholder: "e.g., 123456789" },
        );
      }

      await command.run(() => service.markRead(notificationId));
    });

  notifications
    .command("done")
    .description("Mark a notification as done.")
    .arguments("[id]")
    .action(async (id?: string) => {
      let notificationId = id;

      if (!notificationId) {
        prompt.guardNonInteractive("Notification ID is required.");

        notificationId = await prompt.text(
          "Enter the notification ID to mark as done:",
          { placeholder: "e.g., 123456789" },
        );
      }

      await command.run(() => service.markDone(notificationId));
    });
};

export default { register };
