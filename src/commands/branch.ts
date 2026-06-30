import { Command } from "commander";

import command from "@/core/command";
import branchService from "@/services/branch";

const collect = (value: string, previous: string[]): string[] => [
  ...previous,
  value,
];

const register = (program: Command) => {
  const branch = program
    .command("branch")
    .description("Manage branch and tag protection rules.");

  branch
    .command("protect <pattern>")
    .description("Protect a branch pattern.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option(
      "--required-checks <check>",
      "Required status check (repeatable)",
      collect,
      [],
    )
    .option("--required-reviews <n>", "Required approving reviews", "1")
    .option("--dismiss-stale", "Dismiss stale reviews", false)
    .action(async (pattern: string, options) => {
      const reviews = parseInt(options.requiredReviews, 10);
      await command.run(() =>
        branchService.protect({
          repo: options.repo,
          branch: pattern,
          requiredChecks: options.requiredChecks,
          requiredReviews: isNaN(reviews) ? undefined : reviews,
          dismissStale: options.dismissStale,
        }),
      );
    });

  branch
    .command("unprotect <pattern>")
    .description("Remove branch protection.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (pattern: string, options: { repo?: string }) => {
      await command.run(() =>
        branchService.unprotect({ repo: options.repo, branch: pattern }),
      );
    });

  branch
    .command("protection")
    .description("List branch and tag protection rules.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      await command.run(() => branchService.listProtection(options));
    });

  branch
    .command("tag-protect <pattern>")
    .description("Create a tag protection rule.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (pattern: string, options: { repo?: string }) => {
      await command.run(() =>
        branchService.tagProtect({ repo: options.repo, pattern }),
      );
    });

  branch
    .command("tag-unprotect <pattern>")
    .description("Remove a tag protection rule.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (pattern: string, options: { repo?: string }) => {
      await command.run(() =>
        branchService.tagUnprotect({ repo: options.repo, pattern }),
      );
    });

  branch
    .command("stale")
    .description("List stale local branches older than N days.")
    .option("--days <n>", "Days threshold", "30")
    .option("--merged", "Only show merged branches", false)
    .action(async (options: { days: string; merged?: boolean }) => {
      const { default: staleService } = await import("@/services/stale");
      await command.run(() =>
        staleService.stale({
          days: parseInt(options.days, 10),
          merged: options.merged,
        }),
      );
    });

  branch
    .command("sweep")
    .description("Delete local branches matching a pattern.")
    .requiredOption("--pattern <pattern>", "Branch name pattern (glob)")
    .option("--days <n>", "Only sweep branches older than N days", "30")
    .option("--merged", "Only sweep merged branches", false)
    .option("--dry", "Dry run (show what would be deleted)", false)
    .action(
      async (options: {
        pattern: string;
        days: string;
        merged?: boolean;
        dry?: boolean;
      }) => {
        const { default: staleService } = await import("@/services/stale");
        await command.run(() =>
          staleService.sweep({
            pattern: options.pattern,
            days: parseInt(options.days, 10),
            merged: options.merged,
            dry: options.dry,
          }),
        );
      },
    );
};

export default { register };
