import { Command } from "commander";

import command from "@/core/command";
import repoResolver from "@/core/repo";
import workflowService from "@/services/workflow";
import { commandGroup } from "@/operations/groups";

const collect = (value: string, previous: string[]): string[] => [
  ...previous,
  value,
];

const register = (program: Command) => {
  const workflow = commandGroup(
    program,
    "pipeline",
    "Manage pipeline definitions, runs, artifacts, and caches.",
  )
    .command("definition")
    .description("Manage and inspect pipeline workflows.");

  workflow
    .command("list")
    .description("List repository workflows.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--all", "Include disabled workflows")
    .action(async (options: { repo?: string; all?: boolean }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => workflowService.list(repo, options));
    });

  workflow
    .command("view <name-or-id>")
    .description("View a repository workflow.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (value: string, options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => workflowService.view(value, repo));
    });

  workflow
    .command("run <name-or-id>")
    .description("Dispatch a repository workflow.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--ref <branch>", "Branch or tag to run")
    .option("--field <key=value>", "Workflow input", collect, [])
    .action(async (value: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() =>
        workflowService.run(value, {
          repo,
          ref: options.ref,
          fields: options.field,
        }),
      );
    });

  for (const enabled of [true, false]) {
    const action = enabled ? "enable" : "disable";
    workflow
      .command(`${action} <name-or-id>`)
      .description(`${enabled ? "Enable" : "Disable"} a repository workflow.`)
      .option("--repo <repo>", "Repository (owner/repo)")
      .action(async (value: string, options: { repo?: string }) => {
        const repo = await repoResolver.resolveRepo(options.repo);
        await command.run(() =>
          workflowService.setEnabled(value, repo, enabled),
        );
      });
  }

  workflow
    .command("validate")
    .description("Validate workflow files before pushing.")
    .argument("[path]", "Optional workflow file path")
    .action(async (targetPath?: string) => {
      await command.run(() => workflowService.validate(targetPath));
    });

  workflow
    .command("preview")
    .description("Preview workflow job graph, runners, and matrix.")
    .argument("[path]", "Optional workflow file path")
    .action(async (targetPath?: string) => {
      await command.run(() => workflowService.preview(targetPath));
    });
};

export default { register };
