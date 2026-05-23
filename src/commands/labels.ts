import { Command } from "commander";

import command from "@/core/command";
import { TEMPLATES_DIR } from "@/core/constants";

import labelsService from "@/services/labels";

const register = (program: Command) => {
  const labels = program
    .command("labels")
    .description("Manage labels for a repository.");

  labels.addHelpText(
    "after",
    `
Examples:
  ghitgud labels list
  ghitgud labels pull -t conventional
  ghitgud labels push
`,
  );

  labels
    .command("list")
    .description("List all labels for a repository.")
    .action(() => void command.run(() => labelsService.list()));

  labels
    .command("pull")
    .description("Pull all related labels for a repository.")
    .option(
      "-t, --template <name>",
      "Pull from a built-in template instead of the remote repository",
    )
    .action(async (options) => {
      await command.run(() => {
        if (options.template) {
          return labelsService.pullTemplate(options.template, TEMPLATES_DIR);
        }

        return labelsService.pull();
      });
    });

  labels
    .command("push")
    .description("Push all related labels for a repository.")
    .option(
      "-t, --template <name>",
      "Push from a built-in template instead of the local metadata file",
    )
    .action(async (options) => {
      await command.run(() => {
        if (options.template) {
          return labelsService.pushTemplate(options.template, TEMPLATES_DIR);
        }

        return labelsService.push();
      });
    });

  labels
    .command("prune")
    .description("Prune all related labels for a repository.")
    .action(() => void command.run(() => labelsService.prune()));
};

export default { register };
