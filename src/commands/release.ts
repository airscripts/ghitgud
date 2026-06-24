import { Command } from "commander";

import command from "@/core/command";
import repoResolver from "@/core/repo";
import releaseService from "@/services/release";
import type { BumpLevel } from "@/core/conventional";
import { RELEASE_DEFAULT_GENERATED } from "@/core/constants";

const VALID_BUMP_LEVELS = new Set(["major", "minor", "patch"]);

const validateBumpLevel = (value: string): string => {
  if (!VALID_BUMP_LEVELS.has(value)) {
    throw new Error(
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
  ghg release changelog
  ghg release bump --create --push
  ghg release verify 2.10.0
  ghg release notes --template templates/custom.md
  ghg release draft --level minor
`,
  );

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
    .description("Create a draft release on GitHub.")
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
