import { Command } from "commander";
import prService from "@/services/pr";
import stackService from "@/services/stack";

const register = (program: Command) => {
  const pr = program
    .command("pr")
    .description("Manage pull requests for a repository.");

  pr.command("cleanup")
    .description("Delete merged branches locally and remotely, and fast-forward the base branch.")
    .option("--dry-run", "Show what would be done without making changes", false)
    .option("--force", "Skip confirmation prompts (commits ahead check)", false)
    .action(async (options) => {
      await prService.cleanup({
        dryRun: options.dryRun,
        force: options.force,
      });
    });

  pr.command("push <pr-number>")
    .description("Push current local changes back to a contributor's fork.")
    .option("-f, --force", "Force push even if there are diverged commits")
    .action(async (prNumber: string, options) => {
      await prService.push(parseInt(prNumber, 10), options.force);
    });

  const stack = pr
    .command("stack")
    .description("Manage stacked PRs (create/update dependent chains).");

  stack
    .command("create")
    .description("Create a new stack from current branch.")
    .option("--base <branch>", "Base branch for the stack (default: auto)", "auto")
    .action(async (options) => {
      await stackService.create({ base: options.base });
    });

  stack
    .command("list")
    .description("Show current stack status.")
    .action(async () => {
      await stackService.list();
    });

  stack
    .command("update")
    .description("Update existing stack after parent PR merges.")
    .action(async () => {
      await stackService.update();
    });

  stack
    .command("push")
    .description("Push entire stack and create/update PRs.")
    .option("--base <branch>", "Base branch for the stack")
    .option("--title <title>", "Title template for stacked PRs", "feat: {branch}")
    .option("--draft", "Create PRs as drafts", false)
    .action(async (options) => {
      await stackService.push({
        title: options.title,
        draft: options.draft,
      });
    });
};

export default { register };
