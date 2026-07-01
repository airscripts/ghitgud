import { Command } from "commander";

import command from "@/core/command";
import parse from "@/core/parse";
import prompt from "@/core/prompt";
import repoResolver from "@/core/repo";
import releaseService from "@/services/release";
import type { BumpLevel } from "@/core/conventional";
import { RELEASE_DEFAULT_GENERATED } from "@/core/constants";
import { GitfleetError } from "@/core/errors";

const VALID_BUMP_LEVELS = new Set(["major", "minor", "patch"]);

const validateBumpLevel = (value: string): string => {
  if (!VALID_BUMP_LEVELS.has(value)) {
    throw new GitfleetError(
      `Invalid level: ${value}. Expected: ${Array.from(VALID_BUMP_LEVELS).join(", ")}.`,
    );
  }

  return value;
};

const register = (program: Command) => {
  const release = program
    .command("release")
    .description("Release automation: changelog, bump, verify, notes, draft.");

  release.addHelpText(
    "after",
    `
Examples:
  gitfleet release changelog
  gitfleet release bump --create --push
  gitfleet release verify 2.10.0
  gitfleet release notes --template templates/custom.md
  gitfleet release draft --level minor
  gitfleet release list --limit 10
  gitfleet release view 2.15.0
`,
  );

  release
    .command("list")
    .description("List releases.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--limit <n>", "Maximum releases", "30")
    .action(async (options: { repo?: string; limit: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() =>
        releaseService.list({
          repo,
          limit: parse.parsePositiveInt(options.limit, "limit"),
        }),
      );
    });

  release
    .command("view <tag>")
    .description("View a release.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (tag: string, options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => releaseService.view(tag, repo));
    });

  release
    .command("create <tag>")
    .description("Create a release.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--title <title>", "Release title")
    .option("--notes <text>", "Release notes")
    .option("--draft", "Create as a draft")
    .option("--prerelease", "Mark as a prerelease")
    .option("--latest", "Mark as the latest release")
    .action(async (tag: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => releaseService.create(tag, { ...options, repo }));
    });

  release
    .command("edit <tag>")
    .description("Edit a release.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--title <title>", "Release title")
    .option("--notes <text>", "Release notes")
    .action(async (tag: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => releaseService.edit(tag, { ...options, repo }));
    });

  release
    .command("delete <tag>")
    .description("Delete a release.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--yes", "Confirm deletion", false)
    .action(async (tag: string, options: { repo?: string; yes: boolean }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      if (!options.yes) {
        prompt.guardNonInteractive("Release deletion requires --yes.");
        if (!(await prompt.confirm(`Delete release ${tag}?`))) return;
      }
      await command.run(() => releaseService.remove(tag, repo));
    });

  release
    .command("download <tag>")
    .description("Download release assets.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--pattern <glob>", "Asset name pattern")
    .option("--output-dir <dir>", "Download directory")
    .action(async (tag: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() =>
        releaseService.download(tag, { ...options, repo }),
      );
    });

  release
    .command("upload <tag> <files...>")
    .description("Upload release assets.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--clobber", "Replace assets with matching names")
    .action(async (tag: string, files: string[], options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() =>
        releaseService.upload(tag, files, { ...options, repo }),
      );
    });

  release
    .command("delete-asset <tag> <asset-name>")
    .description("Delete a release asset.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--yes", "Confirm deletion", false)
    .action(async (tag: string, assetName: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      if (!options.yes) {
        prompt.guardNonInteractive("Release asset deletion requires --yes.");
        if (!(await prompt.confirm(`Delete release asset ${assetName}?`)))
          return;
      }
      await command.run(() => releaseService.deleteAsset(tag, assetName, repo));
    });

  release
    .command("changelog")
    .description("Generate changelog from conventional commits.")
    .option("--since <tag>", "Start tag")
    .option("--to <tag>", "End ref", "HEAD")
    .action(async (options) => {
      await command.run(() =>
        releaseService.changelog({
          to: options.to,
          since: options.since,
        }),
      );
    });

  release
    .command("bump")
    .description("Auto-detect or specify the next semver bump.")
    .option("--level <level>", "major, minor, or patch", validateBumpLevel)
    .option("--create", "Create an annotated tag locally")
    .option("--push", "Push the tag to origin (requires --create)")
    .action(async (options) => {
      await command.run(() =>
        releaseService.bump({
          push: options.push,
          level: options.level,
          create: options.create,
        }),
      );
    });

  release
    .command("verify <tag>")
    .description("Verify local tag/commit GPG signatures and release assets.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (tag: string, options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => releaseService.verify(tag, { repo }));
    });

  release
    .command("notes")
    .description("Generate release notes from a template.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--template <file>", "Custom template file")
    .option("--since <tag>", "Start tag")
    .option("--out <file>", "Write to file instead of stdout")
    .action(
      async (options: {
        template?: string;
        since?: string;
        out?: string;
        repo?: string;
      }) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          releaseService.notes({
            repo,
            out: options.out,
            since: options.since,
            templateFile: options.template,
          }),
        );
      },
    );

  release
    .command("draft")
    .description("Create a draft release on the provider.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--level <level>", "major, minor, or patch", "patch")
    .option("--title <title>", "Release title")
    .option(
      "--notes <text>",
      'Release notes text or "generated"',
      RELEASE_DEFAULT_GENERATED,
    )
    .action(
      async (options: {
        level?: string;
        title?: string;
        notes?: string;
        repo?: string;
      }) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          releaseService.draft({
            repo,
            title: options.title,
            notes: options.notes,
            level: options.level as BumpLevel,
          }),
        );
      },
    );
};

export default { register };
