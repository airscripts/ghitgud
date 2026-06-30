import { Command, Option } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import packageService from "@/services/package";

const packageTypeOption = new Option(
  "--type <type>",
  "Package type (npm, maven, rubygems, docker, container, nuget, pypi, composer)",
).default("npm");

const register = (program: Command) => {
  const pkg = program
    .command("package")
    .description("Manage packages and container images.");

  pkg
    .command("list")
    .description("List packages.")
    .option("--org <org>", "Organization login")
    .option("--repo <repo>", "Repository (owner/repo)")
    .addOption(packageTypeOption)
    .action(async (options) => {
      await command.run(() =>
        packageService.list({
          org: options.org,
          repo: options.repo,
          packageType: options.type,
        }),
      );
    });

  pkg
    .command("view <name>")
    .description("View package details.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .addOption(packageTypeOption)
    .action(async (name: string, options) => {
      await command.run(() =>
        packageService.view(name, {
          repo: options.repo,
          packageType: options.type,
        }),
      );
    });

  pkg
    .command("versions <name>")
    .description("List package versions.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .addOption(packageTypeOption)
    .action(async (name: string, options) => {
      await command.run(() =>
        packageService.versionsList(name, {
          repo: options.repo,
          packageType: options.type,
        }),
      );
    });

  pkg
    .command("delete <name>")
    .description("Delete a package version.")
    .requiredOption("--version-id <id>", "Version ID to delete")
    .option("--repo <repo>", "Repository (owner/repo)")
    .addOption(packageTypeOption)
    .option("--yes", "Confirm deletion")
    .action(async (name: string, options) => {
      await command.run(() =>
        packageService.deleteVersion(
          name,
          parse.parsePositiveInt(options.versionId, "version ID"),
          {
            repo: options.repo,
            packageType: options.type,
            yes: options.yes,
          },
        ),
      );
    });

  pkg
    .command("restore <name>")
    .description("Restore a deleted package version.")
    .requiredOption("--version-id <id>", "Version ID to restore")
    .option("--repo <repo>", "Repository (owner/repo)")
    .addOption(packageTypeOption)
    .action(async (name: string, options) => {
      await command.run(() =>
        packageService.restoreVersion(
          name,
          parse.parsePositiveInt(options.versionId, "version ID"),
          {
            repo: options.repo,
            packageType: options.type,
          },
        ),
      );
    });
};

export default { register };
