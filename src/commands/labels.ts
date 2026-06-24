import { Command } from "commander";

import command from "@/core/command";
import repoResolver from "@/core/repo";
import labelsService from "@/services/labels";
import { TEMPLATES_DIR } from "@/core/constants";

const register = (program: Command) => {
  const labels = program
    .command("labels")
    .description("Manage labels for a repository.");

  labels.addHelpText(
    "after",
    `
Examples:
  ghg labels list
  ghg labels pull -t conventional
  ghg labels push
`,
  );

  labels
    .command("list")
    .description("List all labels for a repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => labelsService.list(repo));
    });

  labels
    .command("pull")
    .description("Pull all related labels for a repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option(
      "-t, --template <name>",
      "Pull from a built-in template instead of the remote repository",
    )
    .action(async (options) => {
      await command.run(() => {
        if (options.template) {
          return labelsService.pullTemplate(options.template, TEMPLATES_DIR);
        }

        const repo = repoResolver.resolveRepoSync(options.repo);
        return labelsService.pull(repo);
      });
    });

  labels
    .command("push")
    .description("Push all related labels for a repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option(
      "-t, --template <name>",
      "Push from a built-in template instead of the local metadata file",
    )
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() => {
        if (options.template) {
          return labelsService.pushTemplate(
            options.template,
            TEMPLATES_DIR,
            repo,
          );
        }

        return labelsService.push(repo);
      });
    });

  labels
    .command("prune")
    .description("Prune all related labels for a repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--dry-run", "Preview changes without deleting", false)
    .option("--yes", "Confirm deletion", false)
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => labelsService.prune(repo, options));
    });
};

export default { register };
