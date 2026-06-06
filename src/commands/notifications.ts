import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import service from "@/services/notifications";

const register = (program: Command) => {
  const notifications = program
    .command("notifications")
    .description("Manage GitHub notifications.");

  notifications.addHelpText(
    "after",
    `
Examples:
  ghg notifications list
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
      await command.run(() =>
        service.list({
          all: options.all,
          repo: options.repo,
          participating: options.participating,

          limit: options.limit
            ? parse.parsePositiveInt(options.limit, "limit")
            : undefined,
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
        notificationId = await prompt.text(
          "Enter the notification ID to mark as done:",
          { placeholder: "e.g., 123456789" },
        );
      }

      await command.run(() => service.markDone(notificationId));
    });
};

export default { register };
