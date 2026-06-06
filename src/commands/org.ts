import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import orgService from "@/services/org";

const register = (program: Command) => {
  const org = program
    .command("org")
    .description("Manage organization membership.");

  org.addHelpText(
    "after",
    `
Examples:
  ghg org members --org airscripts
  ghg org invite --org airscripts --user octocat --role admin
  ghg org remove --org airscripts --user octocat
`,
  );

  org
    .command("members")
    .description("List organization members.")
    .option("-o, --org <name>", "Organization name")
    .action(async (options) => {
      const orgName = options.org || (await prompt.text("Organization name:"));
      await command.run(() => orgService.list(orgName));
    });

  org
    .command("invite")
    .description("Invite a user to the organization.")
    .option("-o, --org <name>", "Organization name")
    .option("-u, --user <name>", "Username to invite")
    .option(
      "-r, --role <role>",
      "Member role (admin, member, billing_manager)",
      "member",
    )
    .action(async (options) => {
      const orgName = options.org || (await prompt.text("Organization name:"));

      const username =
        options.user || (await prompt.text("Username to invite:"));

      await command.run(() => orgService.add(orgName, username, options.role));
    });

  org
    .command("remove")
    .description("Remove a user from the organization.")
    .option("-o, --org <name>", "Organization name")
    .option("-u, --user <name>", "Username to remove")
    .action(async (options) => {
      const orgName = options.org || (await prompt.text("Organization name:"));

      const username =
        options.user || (await prompt.text("Username to remove:"));

      await command.run(() => orgService.remove(orgName, username));
    });
};

export default { register };
