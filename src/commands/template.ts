import { Command } from "commander";

import command from "@/core/command";
import templateService from "@/services/template";

const register = (program: Command) => {
  const template = program
    .command("template")
    .description("Manage issue and PR templates.");

  template
    .command("list")
    .description("List available issue and PR templates.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(() => templateService.list({ repo: options.repo }));
    });

  template
    .command("show <name>")
    .description("Preview a template.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (name: string, options) => {
      await command.run(() =>
        templateService.show(name, { repo: options.repo }),
      );
    });
};

export default { register };
