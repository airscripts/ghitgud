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
  const gist = program.command("gist").description("Manage GitHub gists.");

  gist
    .command("list")
    .description("List gists.")
    .option("--public", "List the global public gist feed")
    .option("--limit <n>", "Maximum gists", "30")
    .action(async (options: { public?: boolean; limit: string }) => {
      await command.run(() =>
        gistService.list({
          public: options.public,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  gist
    .command("view <id>")
    .description("View a gist.")
    .option("--raw", "Print raw file content")
    .option("--file <name>", "Select a gist file")
    .action(async (id: string, options) => {
      await command.run(() => gistService.view(id, options));
    });

  gist
    .command("create <files...>")
    .description("Create a gist from local files.")
    .option("--description <text>", "Gist description")
    .option("--public", "Create a public gist")
    .action(async (files: string[], options) => {
      await command.run(() => gistService.create(files, options));
    });

  gist
    .command("edit <id>")
    .description("Add, update, or remove gist files.")
    .option("--add <file>", "Local file to add or update", collect, [])
    .option("--remove <name>", "Gist filename to remove", collect, [])
    .action(async (id: string, options) => {
      await command.run(() => gistService.edit(id, options));
    });

  gist
    .command("delete <id>")
    .description("Delete a gist.")
    .option("--yes", "Confirm deletion", false)
    .action(async (id: string, options: { yes: boolean }) => {
      if (!options.yes) {
        prompt.guardNonInteractive("Gist deletion requires --yes.");
        if (!(await prompt.confirm(`Delete gist ${id}?`))) return;
      }
      await command.run(() => gistService.remove(id));
    });

  gist
    .command("clone <id>")
    .description("Clone a gist repository.")
    .option("--dir <dir>", "Clone destination")
    .action(async (id: string, options: { dir?: string }) => {
      await command.run(() => gistService.clone(id, options.dir));
    });

  gist
    .command("fork <id>")
    .description("Fork a gist.")
    .action(async (id: string) => {
      await command.run(() => gistService.fork(id));
    });

  gist
    .command("star <id>")
    .description("Star a gist.")
    .action(async (id: string) => {
      await command.run(() => gistService.star(id));
    });

  gist
    .command("unstar <id>")
    .description("Unstar a gist.")
    .action(async (id: string) => {
      await command.run(() => gistService.unstar(id));
    });

  gist
    .command("comment <id>")
    .description("Comment on a gist.")
    .requiredOption("--body <text>", "Comment body")
    .action(async (id: string, options: { body: string }) => {
      await command.run(() => gistService.comment(id, options.body));
    });
};

export default { register };
