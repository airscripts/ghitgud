import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import inviteService from "@/services/invites";
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

const register = (program: Command) => {
  const repo = program
    .command("repo")
    .description("Manage single repository collaborators and teams.");

  repo.addHelpText(
    "after",
    `
Examples:
  ghg repo invite --repo airscripts/ghitgud --user octocat --role push
  ghg repo grant --repo airscripts/ghitgud --team ops --role admin
`,
  );

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
};

export default { register };
