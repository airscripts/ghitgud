import { Command } from "commander";

import command from "@/core/command";
import issueService from "@/services/issue";

const register = (program: Command) => {
  const issue = program.command("issue").description("Manage issues.");

  issue
    .command("subtasks")
    .description("List, create, or link sub-issues.")
    .argument("<issue>", "Parent issue number")
    .option("--create", "Create a new sub-issue", false)
    .option("--title <title>", "Title for a created sub-issue")
    .option("--body <body>", "Body for a created sub-issue")
    .option("--link <issue>", "Existing issue number to link")
    .action(
      async (
        issueNumber: string,
        options: {
          body?: string;
          link?: string;
          title?: string;
          create?: boolean;
        },
      ) => {
        await command.run(() => issueService.subtasks(issueNumber, options));
      },
    );

  issue
    .command("parent")
    .description("Link an issue to a parent issue.")
    .argument("<child>", "Child issue number")
    .requiredOption("--parent <parent>", "Parent issue number")
    .action(async (child: string, options: { parent?: string }) => {
      await command.run(() => issueService.parent(child, options));
    });
};

export default { register };
