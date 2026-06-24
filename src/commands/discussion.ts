import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import discussionService from "@/services/discussion";

const register = (program: Command) => {
  const discussion = program
    .command("discussion")
    .description("Manage GitHub Discussions.");

  discussion
    .command("list")
    .description("List discussions by category.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--category <name>", "Filter by category name")
    .option("--limit <n>", "Maximum discussions to fetch", "30")
    .action(
      async (options: { category?: string; limit?: string; repo?: string }) => {
        const limit = options.limit
          ? parse.parsePositiveInt(options.limit, "limit")
          : undefined;

        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          discussionService.list(repo, {
            category: options.category,
            limit,
          }),
        );
      },
    );

  discussion
    .command("view")
    .description("View a discussion.")
    .argument("<number>", "Discussion number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (number: string, options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        discussionService.view(
          repo,
          parse.parsePositiveInt(number, "discussion number"),
        ),
      );
    });

  discussion
    .command("create")
    .description("Create a new discussion.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--title <title>", "Discussion title")
    .requiredOption("--category <category>", "Discussion category")
    .option("--body <body>", "Discussion body")
    .action(
      async (options: {
        title: string;
        category: string;
        body?: string;
        repo?: string;
      }) => {
        const repo = await repoResolver.resolveRepo(options.repo);
        await command.run(() => discussionService.create(repo, options));
      },
    );

  discussion
    .command("comment")
    .description("Add a comment to a discussion.")
    .argument("<number>", "Discussion number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--body <body>", "Comment body")
    .action(
      async (number: string, options: { body: string; repo?: string }) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          discussionService.comment(repo, number, options.body),
        );
      },
    );

  discussion
    .command("close")
    .description("Close a discussion.")
    .argument("<number>", "Discussion number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (number: string, options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => discussionService.close(repo, number));
    });

  discussion
    .command("categories")
    .description("List available discussion categories.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => discussionService.categories(repo));
    });
};

export default { register };
