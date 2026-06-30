import { Command } from "commander";

import command from "@/core/command";
import attestationService from "@/services/attestation";

const register = (program: Command) => {
  const attestation = program
    .command("attestation")
    .description("Manage artifact attestations and provenance.");

  attestation
    .command("list <digest>")
    .description("List attestations for an artifact digest.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (digest: string, options) => {
      await command.run(() =>
        attestationService.list(digest, { repo: options.repo }),
      );
    });

  attestation
    .command("verify <digest>")
    .description("Verify artifact provenance for a digest.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (digest: string, options) => {
      await command.run(() =>
        attestationService.verify(digest, { repo: options.repo }),
      );
    });
};

export default { register };
