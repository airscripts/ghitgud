import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import dependabotService from "@/services/dependabot";
import { commandGroup } from "@/operations/groups";

const addTargetOptions = (command: Command) => {
  return command
    .option("--org <org>", "Target all repositories in an organization")
    .option("--repos <repos>", "Comma-separated owner/repo list")
    .option("--file <path>", "JSON or text file containing repositories")
    .option("--limit <number>", "Maximum repositories to process");
};

const register = (program: Command) => {
  const dependabot = commandGroup(
    program,
    "security",
    "Inspect repository security, alerts, audit, and compliance.",
  )
    .command("dependabot")
    .description("Inspect and triage Dependabot alerts.");

  addTargetOptions(
    dependabot.command("list").description("List Dependabot alerts."),
  )
    .option("--state <state>", "Alert state")
    .option("--severity <severity>", "Alert severity")
    .option("--ecosystem <ecosystem>", "Package ecosystem")
    .option("--package <package>", "Package name")
    .option("--scope <scope>", "Dependency scope")
    .option("--after <date>", "Alerts after an ISO date")
    .option("--before <date>", "Alerts before an ISO date")
    .action(async (options) => {
      await command.run(() => dependabotService.list(options));
    });

  dependabot
    .command("dismiss")
    .description("Dismiss a Dependabot alert.")
    .argument("<alert>", "Dependabot alert number")
    .option("--repo <owner/repo>", "Repository")
    .option("--reason <reason>", "Dismissal reason")
    .option("--comment <comment>", "Dismissal comment")
    .option("--yes", "Dismiss the alert", false)
    .action(async (alert: string, options) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() =>
        dependabotService.dismiss(parse.parsePositiveInt(alert, "alert"), {
          ...options,
          repo,
        }),
      );
    });
};

export default { register };
