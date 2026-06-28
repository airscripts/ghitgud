import { Command } from "commander";

import command from "@/core/command";
import { GhitgudError } from "@/core/errors";
import complianceService from "@/services/compliance";
import { ERROR_NO_REPO_TARGET } from "@/core/constants";

const addTargetOptions = (cmd: Command) => {
  return cmd
    .option("--org <org>", "Target all repositories in an organization")
    .option("--repos <repos>", "Comma-separated owner/repo list")
    .option("--file <path>", "JSON or text file containing repositories")
    .option("--limit <number>", "Maximum repositories to process");
};

const register = (program: Command) => {
  const compliance = program
    .command("compliance")
    .description("Check repository security and compliance posture.");

  addTargetOptions(
    compliance.command("check").description("Score repository compliance."),
  ).action(async (options) => {
    if (!options.org && !options.repos && !options.file) {
      throw new GhitgudError(ERROR_NO_REPO_TARGET);
    }

    await command.run(() => complianceService.check(options));
  });
};

export default { register };
