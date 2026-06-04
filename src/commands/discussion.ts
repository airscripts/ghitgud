import { Command } from "commander";

import command from "@/core/command";
import discussionService from "@/services/discussion";

const register = (program: Command) => {
  const discussion = program
    .command("discussion")
    .description("Manage GitHub Discussions.");

  discussion
    .command("list")
    .description("List discussions by category.")
    .option("--category <name>", "Filter by category name")
    .option("--limit <n>", "Maximum discussions to fetch", "30")
    .action(async (options: { category?: string; limit?: string }) => {
      await command.run(() =>
        discussionService.list({
          category: options.category,
          limit: options.limit ? Number(options.limit) : undefined,
        }),
      );
    });

  discussion
    .command("view")
    .description("View a discussion.")
    .argument("<number>", "Discussion number")
    .action(async (number: string) => {
      await command.run(() => discussionService.view(number));
    });

  discussion
    .command("create")
    .description("Create a new discussion.")
    .requiredOption("--title <title>", "Discussion title")
    .requiredOption("--category <category>", "Discussion category")
    .option("--body <body>", "Discussion body")
    .action(
      async (options: { title: string; category: string; body?: string }) => {
        await command.run(() => discussionService.create(options));
      },
    );

  discussion
    .command("comment")
    .description("Add a comment to a discussion.")
    .argument("<number>", "Discussion number")
    .requiredOption("--body <body>", "Comment body")
    .action(async (number: string, options: { body: string }) => {
      await command.run(() => discussionService.comment(number, options.body));
    });

  discussion
    .command("close")
    .description("Close a discussion.")
    .argument("<number>", "Discussion number")
    .action(async (number: string) => {
      await command.run(() => discussionService.close(number));
    });

  discussion
    .command("pin")
    .description("Pin a discussion.")
    .argument("<number>", "Discussion number")
    .action(async (number: string) => {
      await command.run(() => discussionService.pin(number));
    });

  discussion
    .command("unpin")
    .description("Unpin a discussion.")
    .argument("<number>", "Discussion number")
    .action(async (number: string) => {
      await command.run(() => discussionService.unpin(number));
    });

  discussion
    .command("categories")
    .description("List available discussion categories.")
    .action(async () => {
      await command.run(() => discussionService.categories());
    });
};

export default { register };
