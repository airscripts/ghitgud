import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import teamService from "@/services/team";
import { commandGroup } from "@/operations/groups";
import { GitfleetError } from "@/core/errors";

const register = (program: Command) => {
  const team = commandGroup(
    program,
    "access",
    "Manage organizations, groups, teams, and collaborators.",
  )
    .command("team")
    .description("Manage organization teams.");

  team.addHelpText(
    "after",
    `
Examples:
  gitfleet access team list --org airscripts
  gitfleet access team create --org airscripts --name ops --description "Platform team"
  gitfleet access team add --org airscripts --team ops --user octocat --role maintainer
  gitfleet access team remove --org airscripts --team ops --user octocat
`,
  );

  team
    .command("list")
    .description("List teams in an organization.")
    .option("-o, --org <name>", "Organization name")
    .action(async (options) => {
      if (!options.org)
        prompt.guardNonInteractive("Organization name is required.");

      const orgName = options.org || (await prompt.text("Organization name:"));

      if (!orgName.trim()) {
        throw new GitfleetError("Organization name is required.");
      }

      await command.run(() => teamService.list(orgName));
    });

  team
    .command("create")
    .description("Create a new team.")
    .option("-o, --org <name>", "Organization name")
    .option("-n, --name <name>", "Team name")
    .option("-d, --description <desc>", "Team description")
    .option(
      "-p, --privacy <privacy>",
      "Team privacy (secret, closed)",
      "secret",
    )
    .action(async (options) => {
      if (!options.org)
        prompt.guardNonInteractive("Organization name is required.");

      const orgName = options.org || (await prompt.text("Organization name:"));

      if (!orgName.trim()) {
        throw new GitfleetError("Organization name is required.");
      }

      if (!options.name) prompt.guardNonInteractive("Team name is required.");
      const name = options.name || (await prompt.text("Team name:"));

      if (!name.trim()) {
        throw new GitfleetError("Team name is required.");
      }

      const description =
        options.description || (await prompt.text("Team description:"));

      await command.run(() =>
        teamService.create(orgName, name, description, options.privacy),
      );
    });

  team
    .command("add")
    .description("Add a member to a team.")
    .option("-o, --org <name>", "Organization name")
    .option("-t, --team <name>", "Team slug")
    .option("-u, --user <name>", "Username")
    .option("-r, --role <role>", "Team role (maintainer, member)", "member")
    .action(async (options) => {
      if (!options.org)
        prompt.guardNonInteractive("Organization name is required.");

      const orgName = options.org || (await prompt.text("Organization name:"));

      if (!orgName.trim()) {
        throw new GitfleetError("Organization name is required.");
      }

      if (!options.team) prompt.guardNonInteractive("Team slug is required.");
      const teamSlug = options.team || (await prompt.text("Team slug:"));

      if (!teamSlug.trim()) {
        throw new GitfleetError("Team slug is required.");
      }

      if (!options.user) prompt.guardNonInteractive("Username is required.");
      const username = options.user || (await prompt.text("Username:"));

      if (!username.trim()) {
        throw new GitfleetError("Username is required.");
      }

      await command.run(() =>
        teamService.addMember(orgName, teamSlug, username, options.role),
      );
    });

  team
    .command("remove")
    .description("Remove a member from a team.")
    .option("-o, --org <name>", "Organization name")
    .option("-t, --team <name>", "Team slug")
    .option("-u, --user <name>", "Username")
    .action(async (options) => {
      if (!options.org)
        prompt.guardNonInteractive("Organization name is required.");

      const orgName = options.org || (await prompt.text("Organization name:"));

      if (!orgName.trim()) {
        throw new GitfleetError("Organization name is required.");
      }

      if (!options.team) prompt.guardNonInteractive("Team slug is required.");
      const teamSlug = options.team || (await prompt.text("Team slug:"));

      if (!teamSlug.trim()) {
        throw new GitfleetError("Team slug is required.");
      }

      if (!options.user) prompt.guardNonInteractive("Username is required.");
      const username = options.user || (await prompt.text("Username:"));

      if (!username.trim()) {
        throw new GitfleetError("Username is required.");
      }

      await command.run(() =>
        teamService.removeMember(orgName, teamSlug, username),
      );
    });
};

export default { register };
