import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import cacheService from "@/services/cache";
import { GhitgudError } from "@/core/errors";
import { ERROR_CACHE_KEY_REQUIRED } from "@/core/constants";

const register = (program: Command) => {
  const cache = program
    .command("cache")
    .description("Inspect GitHub Actions caches.");

  cache
    .command("inspect")
    .description("Inspect cache metadata by key.")
    .argument("[key]", "Cache key or prefix")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (key: string | undefined, options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      if (!key) prompt.guardNonInteractive("Cache key is required.");

      const value =
        key ??
        (await prompt.text("Enter cache key to inspect:", {
          placeholder: "linux-node-modules",
        }));

      if (!value.trim()) {
        throw new GhitgudError(ERROR_CACHE_KEY_REQUIRED);
      }

      await command.run(() => cacheService.inspect(value, repo));
    });

  cache
    .command("download")
    .description(
      "Create a local cache debug bundle (metadata + related downloadable assets).",
    )
    .argument("[key]", "Cache key or prefix")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--output-dir <path>", "Output directory for the debug bundle")
    .action(
      async (
        key: string | undefined,
        options: { repo?: string; outputDir?: string },
      ) => {
        const repo = await repoResolver.resolveRepo(options.repo);
        if (!key) prompt.guardNonInteractive("Cache key is required.");

        const value =
          key ??
          (await prompt.text("Enter cache key to download:", {
            placeholder: "linux-node-modules",
          }));

        if (!value.trim()) {
          throw new GhitgudError(ERROR_CACHE_KEY_REQUIRED);
        }

        await command.run(() =>
          cacheService.download(value, { ...options, repo }),
        );
      },
    );
};

export default { register };
