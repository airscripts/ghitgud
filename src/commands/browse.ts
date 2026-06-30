import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import browseService from "@/services/browse";

const register = (program: Command) => {
  const browse = program
    .command("browse")
    .description("Open repository pages in the browser.");

  browse
    .command("repo")
    .description("Open the repository in the browser.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--path <path>", "File or directory path")
    .option("--line <num>", "Line number")
    .action(async (options) => {
      await command.run(() =>
        browseService.browseRepo({
          repo: options.repo,
          path: options.path,
          line: options.line,
        }),
      );
    });

  browse
    .command("issues")
    .description("Open the issues page.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(() =>
        browseService.browseIssues({ repo: options.repo }),
      );
    });

  browse
    .command("pulls")
    .description("Open the pull requests page.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(() =>
        browseService.browsePulls({ repo: options.repo }),
      );
    });

  browse
    .command("actions")
    .description("Open the actions page.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(() =>
        browseService.browseActions({ repo: options.repo }),
      );
    });

  browse
    .command("settings")
    .description("Open the settings page.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(() =>
        browseService.browseSettings({ repo: options.repo }),
      );
    });

  browse
    .command("releases")
    .description("Open the releases page.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options) => {
      await command.run(() =>
        browseService.browseReleases({ repo: options.repo }),
      );
    });

  browse
    .command("pr <number>")
    .description("Open a pull request or issue in the browser.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (number: string, options) => {
      await command.run(() =>
        browseService.browseNumber(parse.parsePositiveInt(number, "number"), {
          repo: options.repo,
        }),
      );
    });
};

export default { register };
