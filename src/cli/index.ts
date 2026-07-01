import process from "process";
import { program } from "commander";

import pc from "picocolors";
import ascii from "./ascii";
import dates from "@/core/dates";
import output from "@/core/output";
import logger from "@/core/logger";
import outputState from "@/core/output-state";
import { ERROR_NO_TOKEN } from "@/core/constants";
import { setTheme, initializeTheme } from "@/core/theme";
import providerRegistry from "@/providers/registry";
import { getOperationFamily } from "@/operations/registry";
import { registerOperations } from "@/operations/register";

import aliasService from "@/services/alias";

import {
  GitfleetError,
  RateLimitError,
  TokenRequiredError,
} from "@/core/errors";

const NAME = "gitfleet";
const DESCRIPTION = "Command every repository as one fleet.";

{
  (async () => {
    outputState.setJsonOutput(process.argv.includes("--json"));
    outputState.setDebug(process.argv.includes("--debug"));

    process.stdout.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EPIPE") {
        process.exit(0);
      }
    });

    process.on("SIGPIPE", () => {
      process.exit(0);
    });

    if (process.argv.includes("--theme=dark")) {
      setTheme("dark");
    } else if (process.argv.includes("--theme=light")) {
      setTheme("light");
    } else if (process.argv.includes("--theme=auto")) {
      setTheme("auto");
    } else {
      initializeTheme();
    }

    program
      .name(NAME)
      .description(DESCRIPTION)
      .version(__VERSION__)
      .option("--json", "Output structured JSON")
      .option("--debug", "Write debug trace to a temporary log file")
      .option("--theme <theme>", "Color theme (dark, light, auto)", "auto")
      .showSuggestionAfterError();

    registerOperations(program);

    program
      .command("version")
      .description("Show version number.")
      .action(() => {
        output.writeResult({ success: true, version: __VERSION__ });

        if (!outputState.isJsonOutput()) {
          console.log(__VERSION__);
        }

        process.exit(0);
      });

    program.addHelpText("before", ascii);

    program.addHelpText(
      "after",
      `
Examples:
  gitfleet auth login --token provider_token
  gitfleet repo view --repo owner/repository
  gitfleet change create --title "Add feature"
  gitfleet review threads 42
  gitfleet issue list --state open
  gitfleet pipeline run list
  gitfleet workspace list
  gitfleet govern report --org example
  gitfleet tui
`,
    );

    program.hook("preAction", () => {
      const args = process.argv.slice(2);
      const expanded = aliasService.resolve(args);
      if (expanded) {
        const isAliasCommand = args[0] === "alias";

        if (!isAliasCommand) {
          process.argv = [process.argv[0], process.argv[1], ...expanded];
        }
      }
    });

    program.hook("preAction", (_root, action) => {
      let family = action;
      while (family.parent && family.parent !== program) {
        family = family.parent;
      }
      const capability = getOperationFamily(family.name())?.capability;
      if (capability) {
        providerRegistry.requireCapability("github", capability);
      }
    });

    program.exitOverride();

    const announceDebugLog = () => {
      if (outputState.isDebug()) {
        console.error("");

        logger.printPill(
          "INFO",
          `Debug log written to: ${logger.getDebugLogPath()}`,
          pc.bgBlue,
          pc.black,
        );
      }
    };

    function handleError(error: unknown): never {
      if (outputState.isDebug()) {
        logger.debugError(error);
      }

      if (error instanceof TokenRequiredError) {
        output.writeError(error.message, ERROR_NO_TOKEN);
        announceDebugLog();
        process.exit(1);
      }

      if (error instanceof RateLimitError) {
        output.writeError(
          error.message,
          `Rate limit resets ${dates.formatRelative(error.resetAt)} (${dates.formatDateShort(error.resetAt)}).`,
        );
        announceDebugLog();
        process.exit(1);
      }

      if (error instanceof GitfleetError) {
        output.writeError(error.message);
        announceDebugLog();
        process.exit(1);
      }

      const commanderError = error as {
        code?: string;
        message?: string;
        exitCode?: number;
      };

      if (commanderError.exitCode === 0) {
        process.exit(0);
      }

      if (commanderError.code === "commander.unknownCommand") {
        console.log();
        console.log(program.helpInformation());
        process.exit(1);
      }

      if (commanderError.code === "commander.help") {
        process.exit(1);
      }

      throw error;
    }

    try {
      await program.parseAsync(process.argv);
    } catch (error) {
      handleError(error);
    }

    if (outputState.isDebug()) {
      console.error("");

      logger.printPill(
        "INFO",
        `Debug log written to: ${logger.getDebugLogPath()}`,
        pc.bgBlue,
        pc.black,
      );
    }

    process.on("unhandledRejection", (error: unknown) => {
      handleError(error);
    });
  })();
}
