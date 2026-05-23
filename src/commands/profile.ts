import { Command } from "commander";

import command from "@/core/command";
import profileService from "@/services/profile";

const register = (program: Command) => {
  const profile = program
    .command("profile")
    .description("Manage account profiles.");

  profile.addHelpText(
    "after",
    `
Examples:
  ghitgud profile add work --repo owner/repo --token ghp_xxx
  ghitgud profile list
  ghitgud profile detect
`,
  );

  profile
    .command("add")
    .description("Add or update a profile.")
    .arguments("<name>")
    .option("--repo <owner/repo>", "Associate the profile with a repo")
    .option("--token <token>", "Store the profile token")
    .action((name: string, options) => {
      void command.run(() => profileService.add(name, options));
    });

  profile
    .command("list")
    .description("List all configured profiles.")
    .action(() => void command.run(() => profileService.list()));

  profile
    .command("switch")
    .description("Switch the active profile.")
    .arguments("<name>")
    .action(async (name: string) => {
      await command.run(() => profileService.switch(name));
    });

  profile
    .command("detect")
    .description("Detect the profile for the current repository.")
    .action(() => void command.run(() => profileService.detect()));
};

export default { register };
