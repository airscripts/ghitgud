import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import parse from "@/core/parse";
import repoResolver from "@/core/repo";
import cacheService from "@/services/cache";
import { GhitgudError } from "@/core/errors";
import { ERROR_CACHE_KEY_REQUIRED } from "@/core/constants";

const register = (program: Command) => {
  const cache = program
    .command("cache")
    .description("Manage and inspect GitHub Actions caches.");

  cache
    .command("list")
    .description("List GitHub Actions caches.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--key <pattern>", "Cache key or prefix")
    .option("--limit <n>", "Maximum caches", "30")
    .action(async (options: { repo?: string; key?: string; limit: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() =>
        cacheService.list({
          repo,
          key: options.key,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  cache
    .command("delete <key>")
    .description("Delete GitHub Actions caches by key.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--all", "Delete all prefix matches")
    .option("--yes", "Confirm deletion", false)
    .action(async (key: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      if (!options.yes) {
        prompt.guardNonInteractive("Cache deletion requires --yes.");
        if (!(await prompt.confirm(`Delete cache entries matching ${key}?`)))
          return;
      }
      await command.run(() => cacheService.remove(key, { ...options, repo }));
    });

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
