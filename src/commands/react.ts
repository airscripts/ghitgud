import { Command, Option } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import reactionService from "@/services/reaction";

const emojiOption = new Option(
  "--emoji <emoji>",
  "Reaction emoji (+1, -1, laugh, confused, heart, hooray, rocket, eyes)",
).choices([
  "+1",
  "-1",
  "laugh",
  "confused",
  "heart",
  "hooray",
  "rocket",
  "eyes",
]);

const register = (program: Command) => {
  const react = program
    .command("react")
    .description("Manage emoji reactions on issues, PRs, and comments.");

  react
    .command("list")
    .description("List reactions.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--issue <number>", "Issue or PR number")
    .option("--comment <id>", "Issue comment ID")
    .option("--review-comment <id>", "PR review comment ID")
    .action(async (options) => {
      await command.run(() =>
        reactionService.list({
          repo: options.repo,
          issue: options.issue
            ? parse.parsePositiveInt(options.issue, "issue")
            : undefined,
          comment: options.comment
            ? parse.parsePositiveInt(options.comment, "comment")
            : undefined,
          reviewComment: options.reviewComment
            ? parse.parsePositiveInt(options.reviewComment, "review comment")
            : undefined,
        }),
      );
    });

  react
    .command("add")
    .description("Add a reaction.")
    .addOption(emojiOption)
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--issue <number>", "Issue or PR number")
    .option("--comment <id>", "Issue comment ID")
    .option("--review-comment <id>", "PR review comment ID")
    .action(async (options) => {
      await command.run(() =>
        reactionService.add({
          repo: options.repo,
          issue: options.issue
            ? parse.parsePositiveInt(options.issue, "issue")
            : undefined,
          comment: options.comment
            ? parse.parsePositiveInt(options.comment, "comment")
            : undefined,
          reviewComment: options.reviewComment
            ? parse.parsePositiveInt(options.reviewComment, "review comment")
            : undefined,
          emoji: options.emoji,
        }),
      );
    });

  react
    .command("remove <reactionId>")
    .description("Remove a reaction.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--issue <number>", "Issue or PR number")
    .option("--comment <id>", "Issue comment ID")
    .option("--review-comment <id>", "PR review comment ID")
    .action(async (reactionId: string, options) => {
      await command.run(() =>
        reactionService.remove({
          repo: options.repo,
          issue: options.issue
            ? parse.parsePositiveInt(options.issue, "issue")
            : undefined,
          comment: options.comment
            ? parse.parsePositiveInt(options.comment, "comment")
            : undefined,
          reviewComment: options.reviewComment
            ? parse.parsePositiveInt(options.reviewComment, "review comment")
            : undefined,
          reactionId: parse.parsePositiveInt(reactionId, "reaction ID"),
        }),
      );
    });
};

export default { register };
