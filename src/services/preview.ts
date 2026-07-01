import pc from "picocolors";

import output from "@/core/output";
import logger from "@/core/logger";
import prompt from "@/core/prompt";
import outputState from "@/core/output-state";
import { GhitgudError } from "@/core/errors";

const PROMPT_TYPES = [
  "text",
  "select",
  "confirm",
  "multiselect",
  "password",
] as const;
type PromptType = (typeof PROMPT_TYPES)[number];

const PREVIEW_RESULTS: Record<string, string> = {
  text: "Sample text input result",
  select: "Option B",
  confirm: "yes",
  multiselect: "Option A, Option C",
  password: "••••••••",
};

const prompter = async (type?: PromptType) => {
  const types = type ? [type] : [...PROMPT_TYPES];
  const results: Record<string, string> = {};

  if (outputState.isJsonOutput()) {
    const preview = types.map((t) => ({
      type: t,
      result: PREVIEW_RESULTS[t] ?? "preview",
    }));
    return { success: true, preview };
  }

  for (const promptType of types) {
    logger.info(`\nPreviewing ${pc.cyan(promptType)} prompt:`);

    switch (promptType) {
      case "text": {
        const result = await prompt.text("Enter some text:", {
          placeholder: "Type something...",
        });
        results.text = result as string;
        break;
      }
      case "select": {
        const result = await prompt.select("Choose an option:", [
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
          { value: "c", label: "Option C" },
        ]);
        results.select = result as string;
        break;
      }
      case "confirm": {
        const result = await prompt.confirm("Do you confirm?");
        results.confirm = result ? "yes" : "no";
        break;
      }
      case "multiselect": {
        const result = await prompt.multiSelect("Select multiple:", [
          { value: "a", label: "Option A" },
          { value: "b", label: "Option B" },
          { value: "c", label: "Option C" },
        ]);
        results.multiselect = (result as string[]).join(", ");
        break;
      }
      case "password": {
        await prompt.text("Enter a password:", {
          placeholder: "••••••••",
        });
        results.password = "••••••••";
        break;
      }
      default:
        throw new GhitgudError(`Unknown prompt type: ${promptType}`);
    }
  }

  output.renderSection("Preview Results");
  output.renderKeyValues(
    Object.entries(results).map(([key, value]) => [key, value]),
  );

  return { success: true, preview: results };
};

export default { prompter, PROMPT_TYPES };
