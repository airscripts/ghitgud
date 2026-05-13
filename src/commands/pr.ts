import { Command } from "commander";
import prService from "@/services/pr";

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
};

export default { register };
