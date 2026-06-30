import { Command } from "commander";

import command from "@/core/command";
import codeService from "@/services/code";

const register = (program: Command) => {
  const code = program
    .command("code")
    .description("Code search and navigation.");

  code
    .command("search <query>")
    .description("Search code across repositories.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--language <lang>", "Filter by language")
    .action(async (query: string, options) => {
      await command.run(() =>
        codeService.search(query, {
          repo: options.repo,
          language: options.language,
        }),
      );
    });

  code
    .command("definitions <symbol>")
    .description("Find symbol definitions.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (symbol: string, options) => {
      await command.run(() =>
        codeService.definitions(symbol, { repo: options.repo }),
      );
    });

  code
    .command("references <symbol>")
    .description("Find symbol references.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (symbol: string, options) => {
      await command.run(() =>
        codeService.references(symbol, { repo: options.repo }),
      );
    });

  code
    .command("file <path>")
    .description("View a file at a specific ref.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--ref <ref>", "Git ref (branch, tag, SHA)")
    .action(async (path: string, options) => {
      await command.run(() =>
        codeService.file(path, {
          repo: options.repo,
          ref: options.ref,
        }),
      );
    });

  code
    .command("blame <path>")
    .description("Enhanced blame with PR context.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (path: string, options) => {
      await command.run(() => codeService.blame(path, { repo: options.repo }));
    });
};

export default { register };
