import { Command } from "commander";

import command from "@/core/command";
import repoResolver from "@/core/repo";
import labelsService from "@/services/labels";
import { TEMPLATES_DIR } from "@/core/constants";

const register = (program: Command) => {
  const labels = program
    .command("label")
    .description("Manage labels for a repository.");

  labels.addHelpText(
    "after",
    `
Examples:
  gitfleet label list
  gitfleet label pull -t conventional
  gitfleet label push
  gitfleet label add bug --color ff0000 --description "Bug report"
  gitfleet label get bug
  gitfleet label edit bug --new-name "Bug Report" --color 00ff00
  gitfleet label remove bug --yes
  gitfleet label clone --source owner/source --target owner/target
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
    .command("add <name>")
    .description("Create a new label.")
    .option("--color <hex>", "Label color hex code (default: ededed)", "ededed")
    .option("--description <text>", "Label description")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (name: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        labelsService.create(
          name,
          {
            color: options.color,
            description: options.description,
          },
          repo,
        ),
      );
    });

  labels
    .command("get <name>")
    .description("View details for a label.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (name: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => labelsService.get(name, repo));
    });

  labels
    .command("edit <name>")
    .description("Update a label.")
    .option("--new-name <name>", "New label name")
    .option("--color <hex>", "New color hex code")
    .option("--description <text>", "New description")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (name: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        labelsService.update(
          name,
          {
            newName: options.newName,
            color: options.color,
            description: options.description,
          },
          repo,
        ),
      );
    });

  labels
    .command("remove <name>")
    .description("Delete a label.")
    .option("--yes", "Confirm deletion")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (name: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        labelsService.deleteLabel(name, repo, { yes: options.yes }),
      );
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
    .command("clone")
    .description("Clone labels from one repository to another.")
    .requiredOption("--source <repo>", "Source repository (owner/repo)")
    .option("--target <repo>", "Target repository (owner/repo)")
    .action(async (options) => {
      const target = await repoResolver.resolveRepo(options.target);
      await command.run(() => labelsService.clone(options.source, target));
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

  labels
    .command("bulk")
    .description("Create labels from a JSON or YAML file.")
    .requiredOption("--file <path>", "Path to labels file")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => labelsService.bulk(options.file, repo));
    });

  labels
    .command("sync")
    .description("Sync labels from another repository.")
    .requiredOption("--source <repo>", "Source repository (owner/repo)")
    .option("--repo <repo>", "Target repository (owner/repo)")
    .action(async (options) => {
      const target = await repoResolver.resolveRepo(options.repo);
      await command.run(() => labelsService.sync(options.source, target));
    });
};

export default { register };
