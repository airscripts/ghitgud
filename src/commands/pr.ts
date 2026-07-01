import { Command, Option } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import prService from "@/services/pr";
import repoResolver from "@/core/repo";
import stackService from "@/services/stack";
import { GhitgudError } from "@/core/errors";
import { ERROR_REVIEW_PR_REQUIRED } from "@/core/constants";

const register = (program: Command) => {
  const pr = program
    .command("pr")
    .description("Manage pull requests for a repository.");

  pr.addHelpText(
    "after",
    `
Examples:
  ghg pr create --title "Add feature"
  ghg pr list --state open
  ghg pr checks 42
  ghg pr merge 42 --squash --delete-branch
  ghg pr cleanup --dry-run
  ghg pr push 42
  ghg pr stack create --base main
`,
  );

  pr.command("create")
    .description("Create a pull request.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--title <title>", "Pull request title")
    .option("--body <body>", "Pull request body")
    .option("--base <branch>", "Base branch (default: repository default)")
    .option("--head <branch>", "Head branch (default: current branch)")
    .option("--draft", "Create as a draft", false)
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => prService.create(repo, options));
    });

  pr.command("list")
    .description("List pull requests.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .addOption(
      new Option("--state <state>", "PR state")
        .choices(["open", "closed", "merged", "all"])
        .default("open"),
    )
    .option("--base <branch>", "Filter by base branch")
    .option("--head <branch>", "Filter by head branch")
    .option("--limit <number>", "Maximum pull requests", "10")
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        prService.list(repo, {
          state: options.state,
          base: options.base,
          head: options.head,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  pr.command("view")
    .description("View a pull request.")
    .argument("<number>", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (number: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => prService.view(repo, number));
    });

  pr.command("edit")
    .description("Edit a pull request.")
    .argument("<number>", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--title <title>", "Replacement title")
    .option("--body <body>", "Replacement body")
    .option("--base <branch>", "Replacement base branch")
    .option("--remove-body", "Clear the pull request body", false)
    .action(async (number: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => prService.edit(repo, number, options));
    });

  for (const [name, description] of [
    ["checkout", "Check out a pull request locally."],
    ["diff", "Show a pull request diff."],
    ["checks", "Show pull request checks."],
    ["lock", "Lock a pull request conversation."],
    ["unlock", "Unlock a pull request conversation."],
    ["ready", "Mark a draft pull request ready for review."],
  ] as const) {
    pr.command(name)
      .description(description)
      .argument("<number>", "Pull request number")
      .option("--repo <repo>", "Repository (owner/repo)")
      .action(async (number: string, options) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(
          async (): Promise<unknown> => prService[name](repo, number),
        );
      });
  }

  pr.command("close")
    .description("Close a pull request.")
    .argument("<number>", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--comment <body>", "Add a comment when closing")
    .action(
      async (number: string, options: { repo?: string; comment?: string }) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          prService.closeWithComment(repo, number, options.comment),
        );
      },
    );

  pr.command("reopen")
    .description("Reopen a pull request.")
    .argument("<number>", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--comment <body>", "Add a comment when reopening")
    .action(
      async (number: string, options: { repo?: string; comment?: string }) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          prService.reopenWithComment(repo, number, options.comment),
        );
      },
    );

  pr.command("merge")
    .description("Merge a pull request.")
    .argument("<number>", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--merge", "Use a merge commit", false)
    .option("--squash", "Squash commits", false)
    .option("--rebase", "Rebase commits", false)
    .option(
      "--delete-branch",
      "Delete a same-repository remote head branch",
      false,
    )
    .action(async (number: string, options) => {
      const selected = [
        options.merge ? "merge" : undefined,
        options.squash ? "squash" : undefined,
        options.rebase ? "rebase" : undefined,
      ].filter(Boolean) as Array<"merge" | "squash" | "rebase">;
      if (selected.length > 1) {
        throw new GhitgudError(
          "Use only one of --merge, --squash, or --rebase.",
        );
      }

      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        prService.merge(repo, number, {
          method: selected[0],
          deleteBranch: options.deleteBranch,
        }),
      );
    });

  pr.command("comment")
    .description("Comment on a pull request.")
    .argument("<number>", "Pull request number")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--body <body>", "Comment body")
    .action(async (number: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => prService.comment(repo, number, options.body));
    });

  pr.command("status")
    .description("Show created and review-requested open pull requests.")
    .option("--repo <repo>", "Filter by repository")
    .action(async (options) => {
      const repo = options.repo
        ? await repoResolver.resolveRepo(options.repo)
        : undefined;

      await command.run(() => prService.status(repo));
    });

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
        if (!prNumber) {
          throw new GhitgudError(ERROR_REVIEW_PR_REQUIRED);
        }

        const parsedPrNumber = parse.parsePositiveInt(prNumber, "PR number");
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
