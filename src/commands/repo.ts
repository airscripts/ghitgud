import { Command } from "commander";

import prompt from "@/core/prompt";
import config from "@/core/config";
import command from "@/core/command";
import { ConfigError } from "@/core/errors";
import inviteService from "@/services/invites";

const parseRepo = (repo?: string): { owner: string; repo: string } => {
  if (repo) {
    const [owner, name] = repo.split("/");

    if (!owner || !name) {
      throw new ConfigError("Invalid repository format. Expected: owner/repo");
    }

    return { owner, repo: name };
  }

  const configuredRepo = config.getRepo();
  if (!configuredRepo) {
    throw new ConfigError(
      "No repository configured. Set one with: ghg config set repo owner/repo",
    );
  }

  const [owner, name] = configuredRepo.split("/");
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
      "push",
    )
    .action(async (options) => {
      const { owner, repo: repoName } = parseRepo(options.repo);
      const username = options.user || (await prompt.text("Username:"));

      void command.run(() =>
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
      "push",
    )
    .action(async (options) => {
      const { owner, repo: repoName } = parseRepo(options.repo);
      const teamSlug = options.team || (await prompt.text("Team slug:"));

      void command.run(() =>
        inviteService.grant(owner, repoName, teamSlug, options.role),
      );
    });
};

export default { register };
