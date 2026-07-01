import { execSync } from "child_process";

import output from "@/core/output";
import outputState from "@/core/output-state";

import { COPILOT_CLI_BINARY } from "@/core/constants";

const COPILOT_INSTALL_URL = "https://github.com/github/copilot-cli";

const detect = (): { installed: boolean; path: string | null } => {
  try {
    const path = execSync(`which ${COPILOT_CLI_BINARY} 2>/dev/null`, {
      encoding: "utf8",
    }).trim();

    return { installed: true, path };
  } catch {
    return { installed: false, path: null };
  }
};

const run = (args: string[]): { success: boolean; output: string } => {
  const { installed } = detect();

  if (!installed) {
    if (outputState.isHumanOutput()) {
      output.renderSection("GitHub Copilot CLI");
      output.renderKeyValues([
        ["Status", "Not installed"],
        ["Install URL", COPILOT_INSTALL_URL],
        ["npm", "npm install -g @github/copilot-cli"],
      ]);
    }

    return {
      success: false,
      output: `GitHub Copilot CLI is not installed. Install from ${COPILOT_INSTALL_URL}`,
    };
  }

  const command = `${COPILOT_CLI_BINARY} ${args.join(" ")}`;

  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: "inherit",
    });

    return { success: true, output: result ?? "" };
  } catch {
    return {
      success: false,
      output: `Copilot CLI exited with an error.`,
    };
  }
};

export default { detect, run, COPILOT_INSTALL_URL };
