import { Command } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import environmentsService from "@/services/environments";

const register = (program: Command) => {
  const environment = program
    .command("environment")
    .description("Manage repository environments and protection rules.");

  environment
    .command("list")
    .description("List configured environments.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (options: { repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => environmentsService.list(repo));
    });

  environment
    .command("create")
    .description("Create an environment.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--name <name>", "Environment name")
    .option(
      "--wait-timer <seconds>",
      "Wait timer in seconds",
      (value: string) => parse.parsePositiveInt(value, "wait timer"),
    )
    .action(
      async (options: { name: string; waitTimer?: number; repo?: string }) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          environmentsService.create(repo, {
            name: options.name,
            waitTimer: options.waitTimer,
          }),
        );
      },
    );

  const protection = environment
    .command("protection")
    .description("Manage environment protection rules.");

  protection
    .command("list")
    .description("List protection rules for an environment.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--env <name>", "Environment name")
    .action(async (options: { env: string; repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        environmentsService.listProtectionRules(repo, options.env),
      );
    });

  protection
    .command("add")
    .description("Add a protection rule to an environment.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--env <name>", "Environment name")
    .requiredOption(
      "--type <type>",
      "Rule type: required_reviewers, branch_policy, wait_timer",
    )
    .requiredOption("--value <value>", "JSON value for the rule")
    .action(
      async (options: {
        env: string;
        type: string;
        value: string;
        repo?: string;
      }) => {
        const repo = await repoResolver.resolveRepo(options.repo);

        await command.run(() =>
          environmentsService.addProtectionRule(repo, {
            env: options.env,

            type: options.type as
              | "required_reviewers"
              | "branch_policy"
              | "wait_timer",

            value: JSON.parse(options.value),
          }),
        );
      },
    );

  protection
    .command("remove")
    .description("Remove a protection rule from an environment.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--env <name>", "Environment name")
    .requiredOption("--rule-id <id>", "Rule ID", (value: string) =>
      parse.parsePositiveInt(value, "rule ID"),
    )
    .action(async (options: { env: string; ruleId: number; repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      await command.run(() =>
        environmentsService.removeProtectionRule(repo, {
          env: options.env,
          ruleId: options.ruleId,
        }),
      );
    });
};

export default { register };
