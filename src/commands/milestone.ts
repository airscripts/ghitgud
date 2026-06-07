import { Command } from "commander";

import prompt from "@/core/prompt";
import command from "@/core/command";
import milestoneService from "@/services/milestone";
import { MilestoneState } from "@/types";

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
    .requiredOption("--title <name>", "Milestone title")
    .requiredOption("--due <date>", "Milestone due date")
    .action(async (options: { title: string; due: string }) => {
      await command.run(() => milestoneService.create(options));
    });

  milestone
    .command("list")
    .description("List milestones.")
    .option(
      "--status <status>",
      "Milestone status (open, closed)",
      validateMilestoneStatus,
      "open",
    )
    .action(async (options: { status: MilestoneState }) => {
      await command.run(() => milestoneService.list(options));
    });

  milestone
    .command("close")
    .description("Close a milestone.")
    .argument("[name]", "Milestone title")
    .action(async (name?: string) => {
      const title =
        name ??
        (await prompt.text("Enter the milestone title to close:", {
          placeholder: "v2.10.0",
        }));

      await command.run(() => milestoneService.close(title));
    });

  milestone
    .command("progress")
    .description("Show milestone completion progress.")
    .argument("[name]", "Milestone title")
    .action(async (name?: string) => {
      const title =
        name ??
        (await prompt.text("Enter the milestone title:", {
          placeholder: "v2.10.0",
        }));

      await command.run(() => milestoneService.progress(title));
    });
};

export default { register };
