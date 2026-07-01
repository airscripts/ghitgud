import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import commentService from "@/services/comment";
import { GitfleetError } from "@/core/errors";
import outputState from "@/core/output-state";
import { commandGroup } from "@/operations/groups";

const register = (program: Command) => {
  const comment = commandGroup(
    program,
    "review",
    "Manage reviews, threads, comments, suggestions, and reactions.",
  )
    .command("conversation")
    .description("Manage issue and PR comments.");

  comment
    .command("list")
    .description("List comments on an issue or PR.")
    .requiredOption("--issue <number>", "Issue or PR number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(() =>
        commentService.list({
          repo: options.repo,
          issue: parse.parsePositiveInt(options.issue, "issue"),
        }),
      );
    });

  comment
    .command("reply")
    .description("Reply to an issue or PR comment thread.")
    .requiredOption("--issue <number>", "Issue or PR number")
    .requiredOption("--body <text>", "Comment body")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(() =>
        commentService.reply({
          repo: options.repo,
          issue: parse.parsePositiveInt(options.issue, "issue"),
          body: options.body,
        }),
      );
    });

  comment
    .command("delete <id>")
    .description("Delete a comment.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--yes", "Confirm deletion", false)
    .action(async (id: string, options: { repo?: string; yes: boolean }) => {
      if (!options.yes) {
        if (!outputState.isHumanOutput()) {
          throw new GitfleetError("Comment deletion requires --yes.");
        }
        if (!(await prompt.confirm(`Delete comment ${id}?`))) return;
      }
      await command.run(() =>
        commentService.remove({
          repo: options.repo,
          commentId: parse.parsePositiveInt(id, "comment ID"),
        }),
      );
    });
};

export default { register };
