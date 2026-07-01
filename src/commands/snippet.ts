import { Command } from "commander";

import parse from "@/core/parse";
import prompt from "@/core/prompt";
import command from "@/core/command";
import gistService from "@/services/gist";

const collect = (value: string, previous: string[]): string[] => [
  ...previous,
  value,
];

const register = (program: Command) => {
  const snippet = program
    .command("snippet")
    .description("Manage provider-hosted snippets.");

  snippet
    .command("list")
    .description("List hosted snippets.")
    .option("--public", "List the global public snippet feed")
    .option("--limit <n>", "Maximum snippets", "30")
    .action(async (options: { public?: boolean; limit: string }) => {
      await command.run(() =>
        gistService.list({
          public: options.public,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  snippet
    .command("view <id>")
    .description("View a snippet.")
    .option("--raw", "Print raw file content")
    .option("--file <name>", "Select a snippet file")
    .action(async (id: string, options) => {
      await command.run(() => gistService.view(id, options));
    });

  snippet
    .command("create <files...>")
    .description("Create a snippet from local files.")
    .option("--description <text>", "Snippet description")
    .option("--public", "Create a public snippet")
    .action(async (files: string[], options) => {
      await command.run(() => gistService.create(files, options));
    });

  snippet
    .command("edit <id>")
    .description("Add, update, or remove snippet files.")
    .option("--add <file>", "Local file to add or update", collect, [])
    .option("--remove <name>", "Snippet filename to remove", collect, [])
    .action(async (id: string, options) => {
      await command.run(() => gistService.edit(id, options));
    });

  snippet
    .command("delete <id>")
    .description("Delete a snippet.")
    .option("--yes", "Confirm deletion", false)
    .action(async (id: string, options: { yes: boolean }) => {
      if (!options.yes) {
        prompt.guardNonInteractive("Snippet deletion requires --yes.");
        if (!(await prompt.confirm(`Delete snippet ${id}?`))) return;
      }
      await command.run(() => gistService.remove(id));
    });

  snippet
    .command("clone <id>")
    .description("Clone a snippet repository.")
    .option("--dir <dir>", "Clone destination")
    .action(async (id: string, options: { dir?: string }) => {
      await command.run(() => gistService.clone(id, options.dir));
    });

  snippet
    .command("fork <id>")
    .description("Fork a snippet.")
    .action(async (id: string) => {
      await command.run(() => gistService.fork(id));
    });

  snippet
    .command("star <id>")
    .description("Star a snippet.")
    .action(async (id: string) => {
      await command.run(() => gistService.star(id));
    });

  snippet
    .command("unstar <id>")
    .description("Unstar a snippet.")
    .action(async (id: string) => {
      await command.run(() => gistService.unstar(id));
    });

  snippet
    .command("comment <id>")
    .description("Comment on a snippet.")
    .requiredOption("--body <text>", "Comment body")
    .action(async (id: string, options: { body: string }) => {
      await command.run(() => gistService.comment(id, options.body));
    });
};

export default { register };
