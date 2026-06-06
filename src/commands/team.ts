import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import teamService from "@/services/team";

const register = (program: Command) => {
  const team = program
    .command("team")
    .description("Manage organization teams.");

  team.addHelpText(
    "after",
    `
Examples:
  ghg team list --org airscripts
  ghg team create --org airscripts --name ops --description "Platform team"
  ghg team add --org airscripts --team ops --user octocat --role maintainer
  ghg team remove --org airscripts --team ops --user octocat
`,
  );

  team
    .command("list")
    .description("List teams in an organization.")
    .option("-o, --org <name>", "Organization name")
    .action(async (options) => {
      const orgName = options.org || (await prompt.text("Organization name:"));
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
      const orgName = options.org || (await prompt.text("Organization name:"));
      const name = options.name || (await prompt.text("Team name:"));

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
      const orgName = options.org || (await prompt.text("Organization name:"));
      const teamSlug = options.team || (await prompt.text("Team slug:"));
      const username = options.user || (await prompt.text("Username:"));

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
      const orgName = options.org || (await prompt.text("Organization name:"));
      const teamSlug = options.team || (await prompt.text("Team slug:"));
      const username = options.user || (await prompt.text("Username:"));

      await command.run(() =>
        teamService.removeMember(orgName, teamSlug, username),
      );
    });
};

export default { register };
