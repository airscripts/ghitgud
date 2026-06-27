import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import labelService from "@/services/repos/label";
import cloneService from "@/services/repos/clone";
import governService from "@/services/repos/govern";
import retireService from "@/services/repos/retire";
import reportService from "@/services/repos/report";
import inspectService from "@/services/repos/inspect";

const addTargetOptions = (command: Command) => {
  return command
    .option("--org <org>", "Target all repositories in an organization")
    .option("--user <user>", "Target all repositories for a user")
    .option("--repos <repos>", "Comma-separated owner/repo list")
    .option("--file <path>", "JSON file containing repository names")
    .option("--limit <number>", "Maximum repositories to process");
};

const register = (program: Command) => {
  const repos = program.command("repos").description("Govern repositories.");

  repos.addHelpText(
    "after",
    `
Examples:
  ghg repos inspect --org airscripts
  ghg repos clone --user octocat
  ghg repos clone --org airscripts --protocol ssh
  ghg repos report --repos owner/one,owner/two
`,
  );

  addTargetOptions(
    repos
      .command("inspect")
      .description("Inspect repository governance files."),
  ).action(async (options) => {
    await command.run(() => inspectService.inspect(options));
  });

  addTargetOptions(
    repos.command("govern").description("Apply repository rulesets."),
  )
    .option("--ruleset <path>", "Ruleset JSON file")
    .option("--dry-run", "Preview changes without mutating", false)
    .option("--yes", "Apply changes", false)
    .action(async (options) => {
      let ruleset = options.ruleset;

      if (!ruleset) {
        ruleset = await prompt.text(
          "Enter the path to your ruleset JSON file:",
          { placeholder: "./ruleset.json" },
        );
      }

      await command.run(() => governService.govern({ ...options, ruleset }));
    });

  addTargetOptions(
    repos.command("label").description("Sync labels across repositories."),
  )
    .option("-t, --template <name>", "Built-in label template")
    .option("--metadata <path>", "Label metadata JSON file")
    .option("--dry-run", "Preview changes without mutating", false)
    .option("--yes", "Apply changes", false)
    .action(async (options) => {
      await command.run(() => labelService.label(options));
    });

  addTargetOptions(
    repos
      .command("retire")
      .description("Find or archive inactive repositories."),
  )
    .option("--months <number>", "Months without commits", "12")
    .option("--include-forks", "Include forked repositories", false)
    .option("--include-private", "Include private repositories", false)
    .option("--dry-run", "Preview changes without mutating", false)
    .option("--yes", "Archive matching repositories", false)
    .action(async (options) => {
      await command.run(() => retireService.retire(options));
    });

  addTargetOptions(
    repos.command("report").description("Report repository metrics."),
  )
    .option("--since <period>", "Reporting window, for example 30d")
    .action(async (options) => {
      await command.run(() => reportService.report(options));
    });

  addTargetOptions(
    repos
      .command("clone")
      .description("Clone repositories to the current directory."),
  )
    .option("--include-forks", "Include forked repositories", false)
    .option("--include-private", "Include private repositories", false)
    .option("--protocol <protocol>", "Git protocol (https or ssh)", "https")
    .option("--dry-run", "Preview changes without cloning", false)
    .action(async (options) => {
      await command.run(() => cloneService.clone(options));
    });
};

export default { register };
