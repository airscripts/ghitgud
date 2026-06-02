import { Command } from "commander";

import command from "@/core/command";
import projectService from "@/services/project";

const register = (program: Command) => {
  const project = program
    .command("project")
    .description("Inspect GitHub Projects.");

  project
    .command("board")
    .description("Render a Project v2 board.")
    .argument("<id>", "Project number")
    .option("--owner <owner>", "Project owner login")
    .action(async (id: string, options: { owner?: string }) => {
      await command.run(() => projectService.board(id, options));
    });
};

export default { register };
