import { Command } from "commander";

import command from "@/core/command";
import leaksService from "@/services/leaks";
import { GitfleetError } from "@/core/errors";
import { ERROR_NO_REPO_TARGET } from "@/core/constants";
import { commandGroup } from "@/operations/groups";

const addTargetOptions = (cmd: Command) => {
  return cmd
    .option("--org <org>", "Target all repositories in an organization")
    .option("--repos <repos>", "Comma-separated owner/repo list")
    .option("--file <path>", "JSON or text file containing repositories")
    .option("--limit <number>", "Maximum repositories to process");
};

const register = (program: Command) => {
  const leaks = commandGroup(
    program,
    "security",
    "Inspect repository security, alerts, audit, and compliance.",
  )
    .command("leaks")
    .description("Scan for secrets and inspect secret scanning alerts.");

  leaks
    .command("scan")
    .description("Run a local read-only scan for likely leaked secrets.")
    .option("--limit <number>", "Maximum findings to render")
    .action(async (options) => {
      await command.run(() => leaksService.scan(options));
    });

  addTargetOptions(
    leaks
      .command("alerts")
      .description("List provider secret scanning alerts."),
  )
    .option("--state <state>", "Alert state")
    .option("--secret-type <type>", "Secret type")
    .option("--resolution <resolution>", "Alert resolution")
    .option("--after <date>", "Alerts after an ISO date")
    .option("--before <date>", "Alerts before an ISO date")
    .action(async (options) => {
      if (!options.org && !options.repos && !options.file) {
        throw new GitfleetError(ERROR_NO_REPO_TARGET);
      }

      await command.run(() => leaksService.alerts(options));
    });
};

export default { register };
