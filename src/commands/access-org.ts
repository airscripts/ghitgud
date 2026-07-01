import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import orgService from "@/services/org";
import { commandGroup } from "@/operations/groups";
import { GitfleetError } from "@/core/errors";

const register = (program: Command) => {
  const org = commandGroup(
    program,
    "access",
    "Manage organizations, groups, teams, and collaborators.",
  )
    .command("org")
    .description("Manage organization membership.");

  org.addHelpText(
    "after",
    `
Examples:
  gitfleet access org members --org airscripts
  gitfleet access org invite --org airscripts --user octocat --role admin
  gitfleet access org remove --org airscripts --user octocat
`,
  );

  org
    .command("members")
    .description("List organization members.")
    .option("-o, --org <name>", "Organization name")
    .action(async (options) => {
      if (!options.org)
        prompt.guardNonInteractive("Organization name is required.");

      const orgName = options.org || (await prompt.text("Organization name:"));

      if (!orgName.trim()) {
        throw new GitfleetError("Organization name is required.");
      }

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
      if (!options.org)
        prompt.guardNonInteractive("Organization name is required.");

      const orgName = options.org || (await prompt.text("Organization name:"));

      if (!orgName.trim()) {
        throw new GitfleetError("Organization name is required.");
      }

      if (!options.user) prompt.guardNonInteractive("Username is required.");

      const username =
        options.user || (await prompt.text("Username to invite:"));

      if (!username.trim()) {
        throw new GitfleetError("Username is required.");
      }

      await command.run(() => orgService.add(orgName, username, options.role));
    });

  org
    .command("remove")
    .description("Remove a user from the organization.")
    .option("-o, --org <name>", "Organization name")
    .option("-u, --user <name>", "Username to remove")
    .action(async (options) => {
      if (!options.org)
        prompt.guardNonInteractive("Organization name is required.");

      const orgName = options.org || (await prompt.text("Organization name:"));

      if (!orgName.trim()) {
        throw new GitfleetError("Organization name is required.");
      }

      if (!options.user) prompt.guardNonInteractive("Username is required.");

      const username =
        options.user || (await prompt.text("Username to remove:"));

      if (!username.trim()) {
        throw new GitfleetError("Username is required.");
      }

      await command.run(() => orgService.remove(orgName, username));
    });
};

export default { register };
