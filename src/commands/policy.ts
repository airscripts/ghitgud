import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import rulesetService from "@/services/ruleset";
import { GitfleetError } from "@/core/errors";
import type { PolicyTarget } from "@/domain/provider";

const resolveTarget = async (options: {
  repo?: string;
  org?: string;
}): Promise<PolicyTarget> => {
  if (options.repo && options.org) {
    throw new GitfleetError("Use either --repo or --org, not both.");
  }
  if (options.org) return { namespace: options.org };
  return { repository: await repoResolver.resolveRepo(options.repo) };
};

const targetOptions = (command: Command): Command =>
  command
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--org <org>", "Organization login");

const register = (program: Command) => {
  const ruleset = program
    .command("policy")
    .description("Manage repository policies and protection rules.");

  targetOptions(ruleset.command("list").description("List rulesets.")).action(
    async (options) => {
      await command.run(async () =>
        rulesetService.list(await resolveTarget(options)),
      );
    },
  );

  targetOptions(
    ruleset.command("view <id>").description("View a ruleset."),
  ).action(async (id: string, options) => {
    await command.run(async () =>
      rulesetService.view(
        parse.parsePositiveInt(id, "ruleset id"),
        await resolveTarget(options),
      ),
    );
  });

  ruleset
    .command("check <branch>")
    .description("Check effective rules for a repository branch.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (branch: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => rulesetService.check(repo, branch));
    });

  targetOptions(
    ruleset
      .command("create")
      .description("Create a ruleset from JSON or YAML.")
      .requiredOption("--file <path>", "Ruleset definition"),
  ).action(async (options) => {
    await command.run(async () =>
      rulesetService.create(options.file, await resolveTarget(options)),
    );
  });

  targetOptions(
    ruleset
      .command("edit <id>")
      .description("Edit a ruleset from JSON or YAML.")
      .requiredOption("--file <path>", "Ruleset definition"),
  ).action(async (id: string, options) => {
    await command.run(async () =>
      rulesetService.edit(
        parse.parsePositiveInt(id, "ruleset id"),
        options.file,
        await resolveTarget(options),
      ),
    );
  });

  targetOptions(
    ruleset
      .command("delete <id>")
      .description("Delete a ruleset.")
      .option("--yes", "Confirm deletion", false),
  ).action(async (id: string, options) => {
    if (!options.yes) {
      prompt.guardNonInteractive("Ruleset deletion requires --yes.");
      if (!(await prompt.confirm(`Delete ruleset ${id}?`))) return;
    }
    await command.run(async () =>
      rulesetService.remove(
        parse.parsePositiveInt(id, "ruleset id"),
        await resolveTarget(options),
      ),
    );
  });

  ruleset
    .command("validate")
    .description("Validate a ruleset definition.")
    .requiredOption("--file <path>", "Ruleset definition")
    .action(async (options) => {
      await command.run(() => rulesetService.validate(options.file));
    });
};

export default { register };
