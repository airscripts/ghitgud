import { Command } from "commander";

import config from "@/core/config";
import prompt from "@/core/prompt";
import command from "@/core/command";
import authService from "@/services/auth";
import { GhitgudError, ConfigError } from "@/core/errors";

import { ERROR_AUTH_NO_TOKEN } from "@/core/constants";

const register = (program: Command) => {
  const auth = program.command("auth").description("Manage authentication.");

  auth.addHelpText(
    "after",
    `
Examples:
  ghg auth login --token ghp_xxx
  ghg auth login --token ghp_xxx --profile work
  ghg auth logout
  ghg auth status
  ghg auth token
  ghg auth token --raw
  ghg auth list
  ghg auth switch work
  ghg auth detect
`,
  );

  auth
    .command("login")
    .description("Authenticate with a GitHub token.")
    .option("--token <token>", "GitHub personal access token")
    .option("--profile <name>", "Profile name (default: default)")
    .action(async (options: { token?: string; profile?: string }) => {
      let token = options.token;
      if (!token) {
        prompt.guardNonInteractive("Token is required.");
        token = await prompt.text("Enter GitHub token:", {
          placeholder: "ghp_...",
        });
      }

      if (!token.trim()) {
        throw new GhitgudError(ERROR_AUTH_NO_TOKEN);
      }

      await command.run(() =>
        authService.login(token, { profile: options.profile }),
      );
    });

  auth
    .command("logout")
    .description("Remove stored credentials.")
    .option("--yes", "Skip confirmation prompt")
    .action(async (options: { yes?: boolean }) => {
      const token = config.getTokenOptional();
      if (!token) {
        throw new GhitgudError(ERROR_AUTH_NO_TOKEN);
      }

      if (!options.yes) {
        prompt.guardNonInteractive("Use --yes to confirm logout.");
        await prompt.confirm("Remove stored credentials?");
      }

      await command.run(() => authService.logout());
    });

  auth
    .command("status")
    .description("Show authentication status.")
    .action(async () => {
      await command.run(() => authService.status());
    });

  auth
    .command("token")
    .description("Print the current token.")
    .option("--raw", "Print the full token without masking")
    .action(async (options: { raw?: boolean }) => {
      await command.run(() => authService.token(options.raw ?? false));
    });

  auth
    .command("list")
    .description("List all configured profiles.")
    .action(async () => {
      await command.run(() => authService.list());
    });

  auth
    .command("switch")
    .description("Switch the active profile.")
    .arguments("[name]")
    .action(async (name?: string) => {
      let profileName = name;

      if (!profileName) {
        const profiles = config.listProfiles();

        if (profiles.length === 0) {
          throw new ConfigError("No profiles configured. Run: ghg auth login");
        }

        profileName = await prompt.select(
          "Which profile would you like to switch to?",
          profiles.map((p) => ({
            value: p.name,
            label: p.active ? `${p.name} (active)` : p.name,
          })),
        );
      }

      await command.run(() => authService.switch(profileName));
    });

  auth
    .command("detect")
    .description("Detect the profile for the current repository.")
    .action(async () => {
      await command.run(() => authService.detect());
    });
};

export default { register };
