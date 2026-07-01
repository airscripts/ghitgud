import { Command, Option } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import codeqlService from "@/services/codeql";
import { commandGroup } from "@/operations/groups";

const stateOption = new Option(
  "--state <state>",
  "Filter by state (open, closed, dismissed, fixed)",
);
const severityOption = new Option(
  "--severity <level>",
  "Filter by severity (critical, high, medium, low, warning, note, error)",
);
const reasonOption = new Option(
  "--reason <reason>",
  "Dismiss reason (false positive, won't fix, used in tests)",
).choices(["false positive", "won't fix", "used in tests"]);

const register = (program: Command) => {
  const codeql = commandGroup(
    program,
    "security",
    "Inspect repository security, alerts, audit, and compliance.",
  )
    .command("codeql")
    .description("Manage CodeQL code scanning alerts.");

  codeql
    .command("list")
    .description("List CodeQL alerts for a repository.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .addOption(stateOption)
    .addOption(severityOption)
    .action(async (options) => {
      await command.run(() =>
        codeqlService.list({
          repo: options.repo,
          state: options.state,
          severity: options.severity,
        }),
      );
    });

  codeql
    .command("view <number>")
    .description("View a CodeQL alert.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (number: string, options: { repo?: string }) => {
      await command.run(() =>
        codeqlService.view({
          repo: options.repo,
          alertNumber: parse.parsePositiveInt(number, "alert number"),
        }),
      );
    });

  codeql
    .command("dismiss <number>")
    .description("Dismiss a CodeQL alert.")
    .addOption(reasonOption)
    .option("--comment <text>", "Dismissal comment")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(
      async (
        number: string,
        options: { reason: string; comment?: string; repo?: string },
      ) => {
        await command.run(() =>
          codeqlService.dismiss({
            repo: options.repo,
            alertNumber: parse.parsePositiveInt(number, "alert number"),
            reason: options.reason,
            comment: options.comment,
          }),
        );
      },
    );
};

export default { register };
