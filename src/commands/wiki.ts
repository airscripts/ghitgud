import { Command } from "commander";

import command from "@/core/command";
import repoResolver from "@/core/repo";
import wikiService from "@/services/wiki";

const register = (program: Command) => {
  const wiki = program.command("wiki").description("Manage repository wikis.");

  wiki
    .command("list")
    .description("List wiki pages.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => wikiService.list(repo));
    });

  wiki
    .command("view")
    .description("View a wiki page's source.")
    .argument("<page>", "Wiki page title or filename")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (page: string, options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => wikiService.view(repo, page));
    });

  wiki
    .command("edit")
    .description("Replace an existing wiki page from a file.")
    .argument("<page>", "Wiki page title or filename")
    .requiredOption("--file <path>", "Source file")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (page: string, options: { file: string; repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => wikiService.edit(repo, page, options.file));
    });

  wiki
    .command("create")
    .description("Create and publish a wiki page from a file.")
    .argument("<page>", "Wiki page title or filename")
    .requiredOption("--file <path>", "Source file")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (page: string, options: { file: string; repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => wikiService.create(repo, page, options.file));
    });

  wiki
    .command("delete")
    .description("Delete a wiki page.")
    .argument("<page>", "Wiki page title or filename")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (page: string, options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => wikiService.delete(repo, page));
    });
};

export default { register };
