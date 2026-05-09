import { Command } from "commander";
import labelsService from "@/services/labels";
import { TEMPLATES_DIR } from "@/core/constants";

const register = (program: Command) => {
  const labels = program
    .command("labels")
    .description("Manage labels for a repository.");

  labels
    .command("list")
    .description("List all labels for a repository.")
    .action(() => void labelsService.list());

  labels
    .command("pull")
    .description("Pull all related labels for a repository.")
    .option("-t, --template <name>", "Pull from a built-in template instead of the remote repository")
    .action(async (options) => {
      if (options.template) {
        await labelsService.pullTemplate(options.template, TEMPLATES_DIR);
      } else {
        await labelsService.pull();
      }
    });

  labels
    .command("push")
    .description("Push all related labels for a repository.")
    .option("-t, --template <name>", "Push from a built-in template instead of the local metadata file")
    .action(async (options) => {
      if (options.template) {
        await labelsService.pushTemplate(options.template, TEMPLATES_DIR);
      } else {
        await labelsService.push();
      }
    });

  labels
    .command("prune")
    .description("Prune all related labels for a repository.")
    .action(() => void labelsService.prune());
};

export default { register };