import { Command } from "commander";

import profileService from "@/services/profile";

const register = (program: Command) => {
  const profile = program
    .command("profile")
    .description("Manage account profiles.");

  profile
    .command("add")
    .description("Add or update a profile.")
    .arguments("<name>")
    .option("--repo <owner/repo>", "Associate the profile with a repo")
    .option("--token <token>", "Store the profile token")
    .action((name: string, options) => {
      void profileService.add(name, options);
    });

  profile
    .command("list")
    .description("List all configured profiles.")
    .action(() => void profileService.list());

  profile
    .command("switch")
    .description("Switch the active profile.")
    .arguments("<name>")
    .action(async (name: string) => {
      await profileService.switch(name);
    });

  profile
    .command("detect")
    .description("Detect the profile for the current repository.")
    .action(() => void profileService.detect());
};

export default { register };
