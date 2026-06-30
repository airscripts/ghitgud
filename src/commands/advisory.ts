import { Command, Option } from "commander";

import command from "@/core/command";
import advisoryService from "@/services/advisory";

const ecosystemOption = new Option(
  "--ecosystem <eco>",
  "Package ecosystem (npm, pip, maven, etc.)",
);

const severityOption = new Option(
  "--severity <level>",
  "Filter by severity (low, medium, high, critical)",
);

const register = (program: Command) => {
  const advisory = program
    .command("advisory")
    .description("Manage security advisories.");

  advisory
    .command("list")
    .description("List security advisories.")
    .addOption(ecosystemOption)
    .addOption(severityOption)
    .option(
      "--state <state>",
      "Filter by state (published, draft, triage, closed)",
    )
    .option(
      "--repo <repo>",
      "Repository (owner/repo) for repo-scoped advisories",
    )
    .action(async (options) => {
      await command.run(() =>
        advisoryService.list({
          ecosystem: options.ecosystem,
          severity: options.severity,
          state: options.state,
          repo: options.repo,
        }),
      );
    });

  advisory
    .command("view <ghsaId>")
    .description("View a security advisory.")
    .option("--repo <repo>", "Repository (owner/repo) for repo-scoped advisory")
    .action(async (ghsaId: string, options) => {
      await command.run(() =>
        advisoryService.view(ghsaId, { repo: options.repo }),
      );
    });

  advisory
    .command("create")
    .description("Create a repository security advisory.")
    .requiredOption("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--summary <text>", "Advisory summary")
    .requiredOption("--description <text>", "Advisory description")
    .requiredOption(
      "--severity <level>",
      "Severity (low, medium, high, critical)",
    )
    .option("--cve-id <id>", "Existing CVE ID")
    .option("--vulnerable-version-range <range>", "Vulnerable version range")
    .option("--patched-version-range <range>", "Patched version range")
    .action(async (options) => {
      await command.run(() =>
        advisoryService.create({
          repo: options.repo,
          summary: options.summary,
          description: options.description,
          severity: options.severity,
          cveId: options.cveId,
          vulnerableVersionRange: options.vulnerableVersionRange,
          patchedVersionRange: options.patchedVersionRange,
        }),
      );
    });

  advisory
    .command("publish <ghsaId>")
    .description("Publish a draft security advisory.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (ghsaId: string, options) => {
      await command.run(() =>
        advisoryService.publish(ghsaId, { repo: options.repo }),
      );
    });

  advisory
    .command("close <ghsaId>")
    .description("Close a security advisory.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (ghsaId: string, options) => {
      await command.run(() =>
        advisoryService.close(ghsaId, { repo: options.repo }),
      );
    });

  advisory
    .command("cve-request <ghsaId>")
    .description("Request a CVE for a published advisory.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (ghsaId: string, options) => {
      await command.run(() =>
        advisoryService.cveRequest(ghsaId, { repo: options.repo }),
      );
    });
};

export default { register };
