import { Command } from "commander";
import profileService from "@/services/profile";

const register = (program: Command) => {
  const profile = program
    .command("profile")
    .description("Manage GitHub account profiles.");

  profile
    .command("list")
    .description("Show all configured profiles.")
    .action(() => void profileService.list());

  profile
    .command("switch")
    .description("Switch active account profile.")
    .arguments("<name>")
    .action((name: string) => void profileService.switchProfile(name));

  profile
    .command("add")
    .description("Add a new profile.")
    .requiredOption("--name <name>", "Profile name")
    .requiredOption("--token <token>", "GitHub personal access token")
    .option("--repo <repo>", "Default repository (owner/repo)")
    .action((options) => {
      profileService.add(options.name, options.token, options.repo);
    });

  profile
    .command("remove")
    .description("Remove a profile.")
    .arguments("<name>")
    .action((name: string) => void profileService.remove(name));

  profile
    .command("detect")
    .description("Auto-detect account from current repo remote.")
    .action(() => void profileService.detect());
};

export default { register };
