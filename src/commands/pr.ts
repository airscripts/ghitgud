import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import prService from "@/services/pr";
import repoResolver from "@/core/repo";
import stackService from "@/services/stack";

const register = (program: Command) => {
  const pr = program
    .command("pr")
    .description("Manage pull requests for a repository.");

  pr.addHelpText(
    "after",
    `
Examples:
  ghg pr cleanup --dry-run
  ghg pr push 42
  ghg pr stack create --base main
`,
  );

  pr.command("cleanup")
    .description(
      "Delete merged branches locally and remotely, and fast-forward the base branch.",
    )
    .option("--repo <repo>", "Repository (owner/repo)")
    .option(
      "--dry-run",
      "Show what would be done without making changes",
      false,
    )
    .option("--force", "Skip confirmation prompts (commits ahead check)", false)
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        prService.cleanup(repo, {
          force: options.force,
          dryRun: options.dryRun,
        }),
      );
    });

  pr.command("push")
    .description("Push current local changes back to a contributor's fork.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .arguments("[pr-number]")
    .option("-f, --force", "Force push even if there are diverged commits")
    .action(
      async (
        prNumber?: string,
        options?: { force?: boolean; repo?: string },
      ) => {
        let prNum = prNumber;

        if (!prNum) {
          prNum = await prompt.text("Enter the PR number to push changes to:", {
            placeholder: "e.g., 42",
          });
        }

        const parsedPrNumber = parse.parsePositiveInt(prNum, "PR number");
        const repo = await repoResolver.resolveRepo(options?.repo);
        await command.run(() =>
          prService.push(parsedPrNumber, repo, options?.force ?? false),
        );
      },
    );

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
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => stackService.list(repo));
    });

  stack
    .command("update")
    .description("Update existing stack after parent PR merges.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => stackService.update(repo));
    });

  stack
    .command("push")
    .description("Push entire stack and create/update PRs.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--base <branch>", "Base branch for the stack")
    .option(
      "--title <title>",
      "Title template for stacked PRs",
      "feat: {branch}",
    )
    .option("--draft", "Create PRs as drafts", false)
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        stackService.push(repo, {
          title: options.title,
          draft: options.draft,
        }),
      );
    });
};

export default { register };
