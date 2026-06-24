import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import repoResolver from "@/core/repo";
import { MilestoneState } from "@/types";
import milestoneService from "@/services/milestone";

const VALID_MILESTONE_STATUSES = new Set(["open", "closed"]);

const validateMilestoneStatus = (value: string): string => {
  if (!VALID_MILESTONE_STATUSES.has(value)) {
    throw new Error(
      `Invalid status: ${value}. Expected: ${Array.from(VALID_MILESTONE_STATUSES).join(", ")}.`,
    );
  }

  return value;
};

const register = (program: Command) => {
  const milestone = program
    .command("milestone")
    .description("Manage repository milestones.");

  milestone
    .command("create")
    .description("Create a milestone.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .requiredOption("--title <name>", "Milestone title")
    .requiredOption("--due <date>", "Milestone due date")
    .action(async (options: { title: string; due: string; repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => milestoneService.create(repo, options));
    });

  milestone
    .command("list")
    .description("List milestones.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .option(
      "--status <status>",
      "Milestone status (open, closed)",
      validateMilestoneStatus,
      "open",
    )
    .action(async (options: { status: MilestoneState; repo?: string }) => {
      const repo = await repoResolver.resolveRepo(options.repo);
      await command.run(() => milestoneService.list(repo, options));
    });

  milestone
    .command("close")
    .description("Close a milestone.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .argument("[name]", "Milestone title")
    .action(async (name?: string, options: { repo?: string } = {}) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      const title =
        name ??
        (await prompt.text("Enter the milestone title to close:", {
          placeholder: "v2.10.0",
        }));

      await command.run(() => milestoneService.close(repo, title));
    });

  milestone
    .command("progress")
    .description("Show milestone completion progress.")
    .option("--repo <repo>", "Repository (owner/repo)")
    .argument("[name]", "Milestone title")
    .action(async (name?: string, options: { repo?: string } = {}) => {
      const repo = await repoResolver.resolveRepo(options.repo);

      const title =
        name ??
        (await prompt.text("Enter the milestone title:", {
          placeholder: "v2.10.0",
        }));

      await command.run(() => milestoneService.progress(repo, title));
    });
};

export default { register };
