import { Command } from "commander";

import command from "@/core/command";
import parse from "@/core/parse";
import prompt from "@/core/prompt";
import repoResolver from "@/core/repo";
import projectService from "@/services/project";

const register = (program: Command) => {
  const project = program
    .command("planning")
    .description("Manage planning boards and work items.");

  project
    .command("list")
    .description("List Projects v2.")
    .option("--owner <owner>", "Project owner login")
    .option("--limit <n>", "Maximum projects", "30")
    .action(async (options) => {
      await command.run(() =>
        projectService.list({
          owner: options.owner,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  project
    .command("view <id>")
    .description("View a Project v2.")
    .option("--owner <owner>", "Project owner login")
    .action(async (id: string, options) => {
      await command.run(() => projectService.view(id, options));
    });

  project
    .command("create")
    .description("Create a Project v2.")
    .requiredOption("--title <title>", "Project title")
    .option("--owner <owner>", "Project owner login")
    .action(async (options) => {
      await command.run(() => projectService.create(options.title, options));
    });

  project
    .command("edit <id>")
    .description("Edit a Project v2.")
    .requiredOption("--title <title>", "Project title")
    .requiredOption("--description <text>", "Project description")
    .option("--owner <owner>", "Project owner login")
    .action(async (id: string, options) => {
      await command.run(() => projectService.edit(id, options));
    });

  project
    .command("close <id>")
    .description("Close a Project v2.")
    .option("--owner <owner>", "Project owner login")
    .action(async (id: string, options) => {
      await command.run(() => projectService.close(id, options));
    });

  project
    .command("delete <id>")
    .description("Delete a Project v2.")
    .option("--owner <owner>", "Project owner login")
    .option("--yes", "Confirm deletion", false)
    .action(async (id: string, options) => {
      if (!options.yes) {
        prompt.guardNonInteractive("Project deletion requires --yes.");
        if (!(await prompt.confirm(`Delete project ${id}?`))) return;
      }
      await command.run(() => projectService.remove(id, options));
    });

  project
    .command("item-list <id>")
    .description("List Project v2 items.")
    .option("--owner <owner>", "Project owner login")
    .option("--limit <n>", "Maximum items", "30")
    .action(async (id: string, options) => {
      await command.run(() =>
        projectService.itemList(id, {
          owner: options.owner,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  project
    .command("item-add <id>")
    .description("Add an issue to a Project v2.")
    .requiredOption("--issue <number>", "Issue number")
    .option("--repo <repo>", "Issue repository (owner/repo)")
    .option("--owner <owner>", "Project owner login")
    .action(async (id: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() =>
        projectService.itemAdd(
          id,
          parse.parsePositiveInt(options.issue, "issue"),
          { owner: options.owner, repo },
        ),
      );
    });

  project
    .command("item-create <id>")
    .description("Create a draft issue in a Project v2.")
    .requiredOption("--title <title>", "Draft issue title")
    .option("--body <text>", "Draft issue body")
    .option("--owner <owner>", "Project owner login")
    .action(async (id: string, options) => {
      await command.run(() => projectService.itemCreate(id, options));
    });

  project
    .command("field-list <id>")
    .description("List Project v2 fields.")
    .option("--owner <owner>", "Project owner login")
    .action(async (id: string, options) => {
      await command.run(() => projectService.fieldList(id, options));
    });

  for (const linked of [true, false]) {
    const action = linked ? "link" : "unlink";
    project
      .command(`${action} <id>`)
      .description(`${linked ? "Link" : "Unlink"} a repository and Project v2.`)
      .requiredOption("--repo <repo>", "Repository (owner/repo)")
      .option("--owner <owner>", "Project owner login")
      .action(async (id: string, options) => {
        await command.run(() =>
          projectService.setLinked(id, options.repo, options, linked),
        );
      });
  }

  project
    .command("board")
    .description("Render a Project v2 board.")
    .argument("<id>", "Project number")
    .option("--owner <owner>", "Project owner login")
    .action(async (id: string, options: { owner?: string }) => {
      await command.run(() => projectService.board(id, options));
    });
};

export default { register };
