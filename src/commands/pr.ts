import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import prService from "@/services/pr";
import stackService from "@/services/stack";

const register = (program: Command) => {
  const pr = program
    .command("pr")
    .description("Manage pull requests for a repository.");

  pr.addHelpText(
    "after",
    `
Examples:
  ghitgud pr cleanup --dry-run
  ghitgud pr push 42
  ghitgud pr stack create --base main
`,
  );

  pr.command("cleanup")
    .description(
      "Delete merged branches locally and remotely, and fast-forward the base branch.",
    )
    .option(
      "--dry-run",
      "Show what would be done without making changes",
      false,
    )
    .option("--force", "Skip confirmation prompts (commits ahead check)", false)
    .action(async (options) => {
      await command.run(() =>
        prService.cleanup({
          force: options.force,
          dryRun: options.dryRun,
        }),
      );
    });

  pr.command("push")
    .description("Push current local changes back to a contributor's fork.")
    .arguments("[pr-number]")
    .option("-f, --force", "Force push even if there are diverged commits")
    .action(async (prNumber?: string, options?: { force?: boolean }) => {
      let prNum = prNumber;

      if (!prNum) {
        prNum = await prompt.text("Enter the PR number to push changes to:", {
          placeholder: "e.g., 42",
        });
      }

      await command.run(() =>
        prService.push(parseInt(prNum, 10), options?.force ?? false),
      );
    });

  pr.command("next")
    .description("Checkout the next PR in a dependency chain.")
    .option("--reverse", "Go to previous PR in chain instead of next")
    .option("--list", "Show all PRs in current stack without checking out")
    .action(async (options) => {
      await command.run(() =>
        stackService.next({
          list: options.list,
          reverse: options.reverse,
        }),
      );
    });

  const stack = pr
    .command("stack")
    .description("Manage stacked PRs (create/update dependent chains).");

  stack
    .command("create")
    .description("Create a new stack from current branch.")
    .option(
      "--base <branch>",
      "Base branch for the stack (default: auto)",
      "auto",
    )
    .action(async (options) => {
      await command.run(() => stackService.create({ base: options.base }));
    });

  stack
    .command("list")
    .description("Show current stack status.")
    .action(async () => {
      await command.run(() => stackService.list());
    });

  stack
    .command("update")
    .description("Update existing stack after parent PR merges.")
    .action(async () => {
      await command.run(() => stackService.update());
    });

  stack
    .command("push")
    .description("Push entire stack and create/update PRs.")
    .option("--base <branch>", "Base branch for the stack")
    .option(
      "--title <title>",
      "Title template for stacked PRs",
      "feat: {branch}",
    )
    .option("--draft", "Create PRs as drafts", false)
    .action(async (options) => {
      await command.run(() =>
        stackService.push({
          title: options.title,
          draft: options.draft,
        }),
      );
    });
};

export default { register };
