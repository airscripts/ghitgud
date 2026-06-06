import { Command } from "commander";

import command from "@/core/command";
import environmentsService from "@/services/environments";

const register = (program: Command) => {
  const environment = program
    .command("environment")
    .description("Manage repository environments and protection rules.");

  environment
    .command("list")
    .description("List configured environments.")
    .action(async () => {
      await command.run(() => environmentsService.list());
    });

  environment
    .command("create")
    .description("Create an environment.")
    .requiredOption("--name <name>", "Environment name")
    .option("--wait-timer <seconds>", "Wait timer in seconds", parseInt)
    .action(async (options) => {
      await command.run(() => environmentsService.create(options));
    });

  const protection = environment
    .command("protection")
    .description("Manage environment protection rules.");

  protection
    .command("list")
    .description("List protection rules for an environment.")
    .requiredOption("--env <name>", "Environment name")
    .action(async (options) => {
      await command.run(() =>
        environmentsService.listProtectionRules(options.env),
      );
    });

  protection
    .command("add")
    .description("Add a protection rule to an environment.")
    .requiredOption("--env <name>", "Environment name")
    .requiredOption(
      "--type <type>",
      "Rule type: required_reviewers, branch_policy, wait_timer",
    )
    .requiredOption("--value <value>", "JSON value for the rule")
    .action(async (options) => {
      await command.run(() =>
        environmentsService.addProtectionRule({
          env: options.env,
          type: options.type,
          value: JSON.parse(options.value),
        }),
      );
    });

  protection
    .command("remove")
    .description("Remove a protection rule from an environment.")
    .requiredOption("--env <name>", "Environment name")
    .requiredOption("--rule-id <id>", "Rule ID", parseInt)
    .action(async (options) => {
      await command.run(() =>
        environmentsService.removeProtectionRule({
          env: options.env,
          ruleId: options.ruleId,
        }),
      );
    });
};

export default { register };
