import { Command } from "commander";

import command from "@/core/command";
import licensesService from "@/services/licenses";

const register = (program: Command) => {
  const licenses = program
    .command("licenses")
    .description("List available open-source licenses.");

  licenses
    .command("list")
    .description("List available open-source licenses.")
    .action(async () => {
      await command.run(() => licensesService.list());
    });

  licenses
    .command("view")
    .description("View a license template.")
    .arguments("<key>")
    .action(async (key: string) => {
      await command.run(() => licensesService.view(key));
    });

  licenses.addHelpText(
    "after",
    `
Examples:
  ghg licenses list
  ghg licenses view mit
  ghg licenses view apache-2.0
`,
  );
};

export default { register };
