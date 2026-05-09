import { Command } from "commander";
import service from "@/services/notifications";

const register = (program: Command) => {
  const notifications = program
    .command("notifications")
    .description("Manage GitHub notifications.");

  notifications
    .command("list")
    .description("List notifications.")
    .option("-a, --all", "Include read notifications")
    .option("-p, --participating", "Only participating notifications")
    .option("-r, --repo <owner/repo>", "Filter by repository")
    .option("-l, --limit <n>", "Max results", "30")
    .action((options) => {
      void service.list({
        all: options.all,
        participating: options.participating,
        repo: options.repo,
        limit: parseInt(options.limit, 10),
      });
    });

  notifications
    .command("read <id>")
    .description("Mark a notification as read.")
    .action((id: string) => {
      void service.markRead(id);
    });

  notifications
    .command("done <id>")
    .description("Mark a notification as done.")
    .action((id: string) => {
      void service.markDone(id);
    });
};

export default { register };
