import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import inviteService from "@/services/invites";
import repositoryService from "@/services/repository";
import { ConfigError, GhitgudError } from "@/core/errors";

const VALID_REPO_ROLES = new Set([
  "pull",
  "push",
  "admin",
  "maintain",
  "triage",
]);

const validateRepoRole = (value: string): string => {
  if (!VALID_REPO_ROLES.has(value)) {
    throw new Error(
      `Invalid role: ${value}. Expected: ${Array.from(VALID_REPO_ROLES).join(", ")}.`,
    );
  }

  return value;
};

const parseRepo = (repo?: string): { owner: string; repo: string } => {
  const resolved = repoResolver.resolveRepoSync(repo);
  const [owner, name] = resolved.split("/");

  if (!owner || !name) {
    throw new ConfigError(
      `Invalid repository: ${resolved}. Expected: owner/repo`,
    );
  }

  return { owner, repo: name };
};

const resolveRepo = (repo?: string): string =>
  repoResolver.resolveRepoSync(repo);

const parsePositiveInt = (value: string): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new GhitgudError(`Invalid positive integer: ${value}.`);
  }

  return parsed;
};

const parseChoice =
  <T extends string>(choices: readonly T[]) =>
  (value: string): T => {
    if (!choices.includes(value as T)) {
      throw new GhitgudError(
        `Invalid value: ${value}. Expected: ${choices.join(", ")}.`,
      );
    }

    return value as T;
  };

const register = (program: Command) => {
  const repo = program
    .command("repo")
    .description("Manage repositories, collaborators, and teams.");

  repo.addHelpText(
    "after",
    `
Examples:
  ghg repo create demo --private
  ghg repo list --owner airscripts --owner-type org
  ghg repo view airscripts/ghitgud
  ghg repo invite --repo airscripts/ghitgud --user octocat --role push
  ghg repo grant --repo airscripts/ghitgud --team ops --role admin
`,
  );

  repo
    .command("create <name>")
    .description("Create a repository.")
    .option("--owner <login>", "Repository owner")
    .option(
      "--owner-type <type>",
      "Owner type (user or org)",
      parseChoice(["user", "org"] as const),
      "user",
    )
    .option("--public", "Create a public repository")
    .option("--private", "Create a private repository")
    .option("--internal", "Create an internal repository")
    .option("--description <text>", "Repository description")
    .option("--template <owner/repo>", "Create from a template repository")
    .action(async (name, options) => {
      const selected = [
        options.public,
        options.private,
        options.internal,
      ].filter(Boolean);

      if (selected.length > 1) {
        throw new GhitgudError("Visibility flags are mutually exclusive.");
      }

      const visibility = options.private
        ? "private"
        : options.internal
          ? "internal"
          : "public";

      await command.run(() =>
        repositoryService.create({ ...options, name, visibility }),
      );
    });

  repo
    .command("list")
    .description("List repositories.")
    .option("--owner <login>", "Repository owner")
    .option(
      "--owner-type <type>",
      "Owner type (user or org)",
      parseChoice(["user", "org"] as const),
      "user",
    )
    .option(
      "--type <type>",
      "Repository type (public, private, all)",
      parseChoice(["public", "private", "all"] as const),
      "all",
    )
    .action(async (options) => {
      await command.run(() => repositoryService.list(options));
    });

  repo
    .command("view [repository]")
    .description("View repository details.")
    .action(async (repository) => {
      await command.run(() => repositoryService.view(resolveRepo(repository)));
    });

  repo
    .command("clone <repository>")
    .description("Clone a repository.")
    .option("--depth <number>", "Create a shallow clone", parsePositiveInt)
    .action(async (repository, options) => {
      await command.run(() =>
        repositoryService.clone(resolveRepo(repository), options.depth),
      );
    });

  repo
    .command("delete <repository>")
    .description("Delete a repository.")
    .option("--yes", "Confirm deletion", false)
    .action(async (repository, options) => {
      const target = resolveRepo(repository);

      if (!options.yes) {
        prompt.guardNonInteractive("Repository deletion requires --yes.");
        if (!(await prompt.confirm(`Delete ${target} permanently?`))) return;
      }

      await command.run(() => repositoryService.remove(target));
    });

  for (const archived of [true, false]) {
    repo
      .command(`${archived ? "archive" : "unarchive"} <repository>`)
      .description(`${archived ? "Archive" : "Unarchive"} a repository.`)
      .action(async (repository) => {
        const target = resolveRepo(repository);
        await command.run(() => repositoryService.update(target, { archived }));
      });
  }

  repo
    .command("rename <repository> <new-name>")
    .description("Rename a repository.")
    .action(async (repository, newName) => {
      await command.run(() =>
        repositoryService.update(resolveRepo(repository), { name: newName }),
      );
    });

  repo
    .command("star <repository>")
    .description("Star a repository.")
    .action(async (repository) => {
      await command.run(() => repositoryService.star(resolveRepo(repository)));
    });

  repo
    .command("unstar <repository>")
    .description("Remove a star from a repository.")
    .action(async (repository) => {
      await command.run(() =>
        repositoryService.unstar(resolveRepo(repository)),
      );
    });

  repo
    .command("edit <repository>")
    .description("Edit repository metadata.")
    .option("--description <text>", "Repository description")
    .option("--homepage <url>", "Repository homepage")
    .option(
      "--visibility <visibility>",
      "Visibility (public or private)",
      parseChoice(["public", "private"] as const),
    )
    .action(async (repository, options) => {
      await command.run(() =>
        repositoryService.update(resolveRepo(repository), options),
      );
    });

  repo
    .command("fork <repository>")
    .description("Fork a repository.")
    .option("--clone", "Clone the new fork", false)
    .option("--remote-name <name>", "Clone remote name", "origin")
    .action(async (repository, options) => {
      await command.run(() =>
        repositoryService.fork(resolveRepo(repository), options),
      );
    });

  repo
    .command("sync [repository]")
    .description("Fast-forward a local repository branch from its upstream.")
    .option("--branch <name>", "Branch to synchronize")
    .action(async (repository, options) => {
      await command.run(() =>
        repositoryService.sync(resolveRepo(repository), options.branch),
      );
    });

  repo
    .command("invite")
    .description("Invite a collaborator to the repository.")
    .option("-r, --repo <owner/repo>", "Target repository")
    .option("-u, --user <name>", "Username")
    .option(
      "--role <role>",
      "Permission level (pull, push, admin, maintain, triage)",
      validateRepoRole,
      "push",
    )
    .action(async (options) => {
      const { owner, repo: repoName } = parseRepo(options.repo);
      if (!options.user) prompt.guardNonInteractive("Username is required.");
      const username = options.user || (await prompt.text("Username:"));

      if (!username.trim()) {
        throw new GhitgudError("Username is required.");
      }

      await command.run(() =>
        inviteService.invite(owner, repoName, username, options.role),
      );
    });

  repo
    .command("grant")
    .description("Grant team access to the repository.")
    .option("-r, --repo <owner/repo>", "Target repository")
    .option("-t, --team <name>", "Team slug")
    .option(
      "--role <role>",
      "Permission level (pull, push, admin, maintain, triage)",
      validateRepoRole,
      "push",
    )
    .action(async (options) => {
      const { owner, repo: repoName } = parseRepo(options.repo);
      if (!options.team) prompt.guardNonInteractive("Team slug is required.");
      const teamSlug = options.team || (await prompt.text("Team slug:"));

      if (!teamSlug.trim()) {
        throw new GhitgudError("Team slug is required.");
      }

      await command.run(() =>
        inviteService.grant(owner, repoName, teamSlug, options.role),
      );
    });

  repo
    .command("syncall")
    .description("Pull latest changes for all local repositories.")
    .option("--root <dir>", "Root directory to scan", process.cwd())
    .action(async (options: { root?: string }) => {
      const { default: syncService } = await import("@/services/sync");
      await command.run(() => syncService.syncall({ root: options.root }));
    });

  repo
    .command("statusall")
    .description("Check status across multiple local repositories.")
    .option("--root <dir>", "Root directory to scan", process.cwd())
    .action(async (options: { root?: string }) => {
      const { default: syncService } = await import("@/services/sync");
      await command.run(() => syncService.statusall({ root: options.root }));
    });
};

export default { register };
