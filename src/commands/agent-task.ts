import { Command } from "commander";

import command from "@/core/command";
import prompt from "@/core/prompt";
import agentTaskService from "@/services/agent-task";

const addTargetOptions = (cmd: Command) => {
  return cmd.option("--repo <repo>", "Repository (owner/repo)");
};

const register = (program: Command) => {
  const agentTask = program
    .command("agent-task")
    .description("Manage GitHub agent tasks.");

  agentTask.addHelpText(
    "after",
    `
Examples:
  ghg agent-task create "Fix the login bug"
  ghg agent-task create "Refactor auth module" --repo owner/repo
  ghg agent-task list
  ghg agent-task list --repo owner/repo
  ghg agent-task view abc123
  ghg agent-task view abc123 --repo owner/repo
`,
  );

  addTargetOptions(
    agentTask
      .command("create")
      .description("Create and optionally follow an agent task.")
      .arguments("[description]")
      .action(async (description?: string, options?: { repo?: string }) => {
        let desc = description;

        if (!desc) {
          desc = await prompt.text("Describe the task:");
        }

        await command.run(() => agentTaskService.create(desc!, options?.repo));
      }),
  );

  addTargetOptions(
    agentTask
      .command("list")
      .description("List agent tasks.")
      .action(async (options) => {
        await command.run(() => agentTaskService.list(options.repo));
      }),
  );

  addTargetOptions(
    agentTask
      .command("view")
      .description("Inspect task state, metadata, and logs.")
      .arguments("<session-or-pr>")
      .action(async (sessionId: string, options) => {
        await command.run(() => agentTaskService.view(sessionId, options.repo));
      }),
  );
};

export default { register };
