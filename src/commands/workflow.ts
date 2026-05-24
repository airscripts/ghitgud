import { Command } from "commander";

import command from "@/core/command";
import workflowService from "@/services/workflow";

const register = (program: Command) => {
  const workflow = program
    .command("workflow")
    .description("Validate and preview GitHub Actions workflows.");

  workflow
    .command("validate")
    .description("Validate workflow files before pushing.")
    .argument("[path]", "Optional workflow file path")
    .action(async (targetPath?: string) => {
      await command.run(() => workflowService.validate(targetPath));
    });

  workflow
    .command("dry-run")
    .description("Preview workflow job graph, runners, and matrix.")
    .argument("[path]", "Optional workflow file path")
    .action(async (targetPath?: string) => {
      await command.run(() => workflowService.dryRun(targetPath));
    });
};

export default { register };
