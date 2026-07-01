import { Command, Option } from "commander";

import parse from "@/core/parse";
import command from "@/core/command";
import deploymentService from "@/services/deployment";

const stateOption = new Option(
  "--state <state>",
  "Deployment state (error, failure, inactive, in_progress, queued, pending, success)",
)
  .choices([
    "error",
    "failure",
    "inactive",
    "in_progress",
    "queued",
    "pending",
    "success",
  ])
  .default("success");

const register = (program: Command) => {
  const deployment = program
    .command("deploy")
    .description("Manage repository deployments.");

  deployment
    .command("list")
    .description("List deployments.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--environment <env>", "Filter by environment")
    .option("--limit <n>", "Maximum deployments", "30")
    .action(
      async (options: {
        repo?: string;
        environment?: string;
        limit: string;
      }) => {
        await command.run(() =>
          deploymentService.list({
            repo: options.repo,
            environment: options.environment,
            limit: parse.parsePositiveInt(options.limit, "limit"),
          }),
        );
      },
    );

  deployment
    .command("view <id>")
    .description("View a deployment.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (id: string, options: { repo?: string }) => {
      await command.run(() =>
        deploymentService.view({
          repo: options.repo,
          id: parse.parsePositiveInt(id, "deployment id"),
        }),
      );
    });

  deployment
    .command("create")
    .description("Create a deployment.")
    .requiredOption("--ref <ref>", "Git ref (branch, SHA, or tag)")
    .requiredOption("--environment <env>", "Deployment environment")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--description <text>", "Deployment description")
    .option("--no-auto-merge", "Disable auto-merge", false)
    .action(async (options) => {
      await command.run(() =>
        deploymentService.create({
          repo: options.repo,
          ref: options.ref,
          environment: options.environment,
          description: options.description,
          autoMerge: options.autoMerge ?? true,
        }),
      );
    });

  deployment
    .command("status <id>")
    .description("List statuses for a deployment.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .action(async (id: string, options: { repo?: string }) => {
      await command.run(() =>
        deploymentService.status({
          repo: options.repo,
          id: parse.parsePositiveInt(id, "deployment id"),
        }),
      );
    });

  const statusCmd = deployment
    .command("status-create")
    .description("Create a deployment status.");

  statusCmd
    .argument("<id>", "Deployment ID")
    .addOption(stateOption)
    .option("--repo <repo>", "Repository (owner/repo)")
    .option("--description <text>", "Status description")
    .option("--target-url <url>", "Target URL")
    .action(async (id: string, options) => {
      await command.run(() =>
        deploymentService.createStatus({
          repo: options.repo,
          id: parse.parsePositiveInt(id, "deployment id"),
          state: options.state,
          description: options.description,
          targetUrl: options.targetUrl,
        }),
      );
    });
};

export default { register };
