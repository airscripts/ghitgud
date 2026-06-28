import { Command } from "commander";

import config from "@/core/config";
import prompt from "@/core/prompt";
import command from "@/core/command";
import profileService from "@/services/profile";
import { GhitgudError, ConfigError } from "@/core/errors";

import {
  ERROR_PROFILE_NAME_REQUIRED,
  ERROR_PROFILE_TOKEN_REQUIRED,
} from "@/core/constants";

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
    .option("--token <token>", "Store the profile token")
    .action(async (name?: string, options?: { token?: string }) => {
      let profileName = name;

      if (!profileName) {
        prompt.guardNonInteractive("Profile name is required.");

        profileName = await prompt.text(
          "What would you like to name this profile?",
          { placeholder: "work, personal, client-project, etc." },
        );
      }

      if (!profileName.trim()) {
        throw new GhitgudError(ERROR_PROFILE_NAME_REQUIRED);
      }

      let token = options?.token;
      if (!token) {
        prompt.guardNonInteractive("Token is required.");

        token = await prompt.text("Enter GitHub token:", {
          placeholder: "ghp_...",
        });
      }

      if (!token.trim()) {
        throw new GhitgudError(ERROR_PROFILE_TOKEN_REQUIRED);
      }

      await command.run(() =>
        profileService.add(profileName, {
          token,
        }),
      );
    });

  profile
    .command("list")
    .description("List all configured profiles.")
    .action(async () => {
      await command.run(() => profileService.list());
    });

  profile
    .command("switch")
    .description("Switch the active profile.")
    .arguments("[name]")
    .action(async (name?: string) => {
      let profileName = name;

      if (!profileName) {
        const profiles = config.listProfiles();

        if (profiles.length === 0) {
          throw new ConfigError(
            "No profiles configured. Create one with: ghg profile add <name>",
          );
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
    .action(async () => {
      await command.run(() => profileService.detect());
    });
};

export default { register };
