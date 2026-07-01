import { Command } from "commander";

import command from "@/core/command";
import { GhitgudError } from "@/core/errors";
import previewService from "@/services/preview";

const register = (program: Command) => {
  const preview = program
    .command("preview")
    .description("Preview utility commands.");

  preview
    .command("prompter")
    .description("Preview supported interactive prompt types.")
    .argument(
      "[type]",
      "Prompt type to preview (text, select, confirm, multiselect, password)",
    )
    .action(async (type?: string) => {
      if (type && !previewService.PROMPT_TYPES.includes(type as never)) {
        const validTypes = previewService.PROMPT_TYPES.join(", ");
        throw new GhitgudError(
          `Unknown prompt type: ${type}. Valid types: ${validTypes}`,
        );
      }

      await command.run(() =>
        previewService.prompter(
          type as Parameters<typeof previewService.prompter>[0],
        ),
      );
    });
};

export default { register };
