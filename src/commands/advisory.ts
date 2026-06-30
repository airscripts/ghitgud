import { Command, Option } from "commander";

import command from "@/core/command";
import advisoryService from "@/services/advisory";

const ecosystemOption = new Option(
  "--ecosystem <eco>",
  "Package ecosystem (npm, pip, maven, etc.)",
);

const register = (program: Command) => {
  const advisory = program
    .command("advisory")
    .description("Query the GitHub Advisory Database.");

  advisory
    .command("list")
    .description("List security advisories.")
    .addOption(ecosystemOption)
    .option(
      "--severity <level>",
      "Filter by severity (low, medium, high, critical)",
    )
    .action(async (options: { ecosystem?: string; severity?: string }) => {
      await command.run(() =>
        advisoryService.list({
          ecosystem: options.ecosystem,
          severity: options.severity,
        }),
      );
    });

  advisory
    .command("view <ghsaId>")
    .description("View a security advisory.")
    .action(async (ghsaId: string) => {
      await command.run(() => advisoryService.view(ghsaId));
    });
};

export default { register };
