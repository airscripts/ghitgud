import { Command } from "commander";

import config from "@/core/config";
import prompt from "@/core/prompt";
import command from "@/core/command";
import authService from "@/services/auth";
import { GitfleetError, ConfigError } from "@/core/errors";

import { ERROR_AUTH_NO_TOKEN } from "@/core/constants";

const register = (program: Command) => {
  const auth = program.command("auth").description("Manage authentication.");

  auth.addHelpText(
    "after",
    `
Examples:
  gitfleet auth login --token ghp_xxx
  gitfleet auth login --token ghp_xxx --profile work
  gitfleet auth status
  gitfleet auth switch work
`,
  );

  auth
    .command("login")
    .description("Authenticate with a provider token.")
    .option("--token <token>", "Provider access token")
    .option("--host <host>", "Provider host", "github.com")
    .option("--profile <name>", "Profile name (default: default)")
    .action(
      async (options: { token?: string; profile?: string; host?: string }) => {
        let token = options.token;
        if (!token) {
          prompt.guardNonInteractive("Token is required.");
          token = await prompt.text("Enter GitHub token:", {
            placeholder: "ghp_...",
          });
        }

        if (!token.trim()) {
          throw new GitfleetError(ERROR_AUTH_NO_TOKEN);
        }

        await command.run(() =>
          authService.login(token, {
            host: options.host,
            profile: options.profile,
          }),
        );
      },
    );

  auth
    .command("logout")
    .description("Remove stored credentials.")
    .option("--yes", "Skip confirmation prompt")
    .action(async (options: { yes?: boolean }) => {
      const token = config.getTokenOptional();
      if (!token) {
        throw new GitfleetError(ERROR_AUTH_NO_TOKEN);
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
    .option("--show-token", "Display the full token in the status output")
    .action(async (options: { showToken?: boolean }) => {
      await command.run(() => authService.status(options.showToken ?? false));
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
          throw new ConfigError(
            "No profiles configured. Run: gitfleet auth login",
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

      await command.run(() => authService.switch(profileName));
    });

  auth
    .command("detect")
    .description("Detect the profile for the current repository.")
    .action(async () => {
      await command.run(() => authService.detect());
    });

  auth
    .command("setup-git")
    .description("Configure git to use gitfleet as credential helper.")
    .action(async () => {
      await command.run(() => authService.setupGit());
    });
};

export default { register };
