import { Command } from "commander";

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
  ghitgud notifications list --participating
  ghitgud notifications list --repo owner/repo --limit 10
  ghitgud notifications read 12345
`,
  );

  notifications
    .command("list")
    .description("List notifications.")
    .option("-a, --all", "Include read notifications")
    .option("-p, --participating", "Only participating notifications")
    .option("-r, --repo <owner/repo>", "Filter by repository")
    .option("-l, --limit <n>", "Max results")
    .action((options) => {
      void command.run(() =>
        service.list({
          all: options.all,
          participating: options.participating,
          repo: options.repo,
          limit: options.limit ? parseInt(options.limit, 10) : undefined,
        }),
      );
    });

  notifications
    .command("read <id>")
    .description("Mark a notification as read.")
    .action((id: string) => {
      void command.run(() => service.markRead(id));
    });

  notifications
    .command("done <id>")
    .description("Mark a notification as done.")
    .action((id: string) => {
      void command.run(() => service.markDone(id));
    });
};

export default { register };
