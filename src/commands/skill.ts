import { Command } from "commander";

import command from "@/core/command";
import prompt from "@/core/prompt";
import { GhitgudError } from "@/core/errors";
import skillService from "@/services/skill";

const register = (program: Command) => {
  const skill = program.command("skill").description("Manage agent skills.");

  skill.addHelpText(
    "after",
    `
Examples:
  ghg skill install owner/repo
  ghg skill install owner/repo skill-name
  ghg skill list
  ghg skill preview owner/repo
  ghg skill publish owner/repo
  ghg skill search "testing framework"
  ghg skill update
  ghg skill update skill-name
`,
  );

  skill
    .command("install")
    .description("Install an agent skill from a repository.")
    .arguments("<repository> [skill]")
    .action(async (repository: string, skillName?: string) => {
      await command.run(() => skillService.install(repository, skillName));
    });

  skill
    .command("list")
    .description("List installed skills.")
    .action(async () => {
      await command.run(() => skillService.list());
    });

  skill
    .command("preview")
    .description("Inspect a skill before installation.")
    .arguments("<repository> [skill]")
    .action(async (repository: string, skillName?: string) => {
      await command.run(() => skillService.preview(repository, skillName));
    });

  skill
    .command("publish")
    .description("Validate and publish a skill.")
    .arguments("[path]")
    .option("--repo <repo>", "Target repository (owner/repo)")
    .action(async (pathArg?: string, options?: { repo?: string }) => {
      let repo = options?.repo;

      if (!repo) {
        if (prompt.isNonInteractive()) {
          throw new GhitgudError("Repository is required. Use --repo.");
        }
        repo = await prompt.text("Target repository (owner/repo):");
      }

      await command.run(() => skillService.publish(repo!, pathArg));
    });

  skill
    .command("search")
    .description("Search available skills.")
    .arguments("[query]")
    .action(async (query?: string) => {
      await command.run(() => skillService.search(query));
    });

  skill
    .command("update")
    .description("Update installed skills.")
    .arguments("[skill]")
    .action(async (skillName?: string) => {
      await command.run(() => skillService.update(skillName));
    });
};

export default { register };
