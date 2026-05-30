import { Command } from "commander";

import config from "@/core/config";
import output from "@/core/output";
import prompt from "@/core/prompt";
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
  ghg profile add work
  ghg profile list
  ghg profile detect
`,
  );

  profile
    .command("add")
    .description("Add or update a profile.")
    .arguments("[name]")
    .option("--repo <owner/repo>", "Associate the profile with a repo")
    .option("--token <token>", "Store the profile token")
    .action(
      async (name?: string, options?: { repo?: string; token?: string }) => {
        let profileName = name;

        if (!profileName) {
          profileName = await prompt.text(
            "What would you like to name this profile?",
            { placeholder: "work, personal, client-project, etc." },
          );
        }

        void command.run(() => profileService.add(profileName, options || {}));
      },
    );

  profile
    .command("list")
    .description("List all configured profiles.")
    .action(() => void command.run(() => profileService.list()));

  profile
    .command("switch")
    .description("Switch the active profile.")
    .arguments("[name]")
    .action(async (name?: string) => {
      let profileName = name;

      if (!profileName) {
        const profiles = config.listProfiles();

        if (profiles.length === 0) {
          output.log(
            "No profiles configured. Create one with: ghg profile add <name>",
          );

          process.exit(1);
        }

        profileName = await prompt.select(
          "Which profile would you like to switch to?",
          profiles.map((p) => ({
            value: p.name,
            label: p.active ? `${p.name} (active)` : p.name,
          })),
        );
      }

      await command.run(() => profileService.switch(profileName));
    });

  profile
    .command("detect")
    .description("Detect the profile for the current repository.")
    .action(() => void command.run(() => profileService.detect()));
};

export default { register };
