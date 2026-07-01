import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import pagesService from "@/services/pages";
import { GitfleetError } from "@/core/errors";
import outputState from "@/core/output-state";

const register = (program: Command) => {
  const pages = program
    .command("site")
    .description("Manage static repository site publishing.");

  pages
    .command("status")
    .description("Show the current static site deployment status.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => pagesService.status(repo));
    });

  pages
    .command("deploy")
    .description("Configure a branch source and request a Pages build.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--source <branch>", "Source branch")
    .option("--path <path>", "Source path (/ or /docs)", "/")
    .option("--build-type <type>", "Build type (legacy or workflow)", "legacy")
    .action(
      async (options: {
        path: string;
        repo?: string;
        source: string;
        buildType?: string;
      }) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          pagesService.deploy(repo, {
            path: options.path,
            source: options.source,
            buildType: options.buildType,
          }),
        );
      },
    );

  pages
    .command("unpublish")
    .description("Unpublish the static site site.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--yes", "Confirm unpublishing", false)
    .action(async (options: { repo?: string; yes: boolean }) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      if (!options.yes) {
        if (!outputState.isHumanOutput()) {
          throw new GitfleetError("Use --yes to confirm unpublishing.");
        }

        const confirmed = await prompt.confirm(
          `Unpublish static site for ${repo}?`,
        );

        if (!confirmed) return;
      }

      await command.run(() => pagesService.unpublish(repo));
    });
};

export default { register };
