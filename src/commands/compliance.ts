import { Command } from "commander";

import command from "@/core/command";
import complianceService from "@/services/compliance";

const addTargetOptions = (command: Command) => {
  return command
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
    await command.run(() => complianceService.check(options));
  });
};

export default { register };
