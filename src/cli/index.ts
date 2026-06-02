import process from "process";
import { program } from "commander";

import ascii from "./ascii";
import dates from "@/core/dates";
import output from "@/core/output";
import prCommand from "@/commands/pr";
import tuiCommand from "@/commands/tui";
import runCommand from "@/commands/run";
import pingCommand from "@/commands/ping";
import issueCommand from "@/commands/issue";
import proxyCommand from "@/commands/proxy";
import reposCommand from "@/commands/repos";
import cacheCommand from "@/commands/cache";
import labelsCommand from "@/commands/labels";
import outputState from "@/core/output-state";
import configCommand from "@/commands/config";
import reviewCommand from "@/commands/review";
import projectCommand from "@/commands/project";
import profileCommand from "@/commands/profile";
import releaseCommand from "@/commands/release";
import insightsCommand from "@/commands/insights";
import mentionsCommand from "@/commands/mentions";
import workflowCommand from "@/commands/workflow";
import { ERROR_NO_TOKEN } from "@/core/constants";
import activityCommand from "@/commands/activity";
import milestoneCommand from "@/commands/milestone";
import { setTheme, initializeTheme } from "@/core/theme";
import notificationsCommand from "@/commands/notifications";

import {
  GhitgudError,
  RateLimitError,
  TokenRequiredError,
} from "@/core/errors";

const NAME = "ghg";
const DESCRIPTION = "A better GitHub CLI that extends the official gh CLI.";

if (!proxyCommand.runProxyFromArgv()) {
  outputState.setJsonOutput(process.argv.includes("--json"));

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
    .option("--theme <theme>", "Color theme (dark, light, auto)", "auto")
    .showSuggestionAfterError();

  proxyCommand.register(program);
  notificationsCommand.register(program);
  activityCommand.register(program);
  mentionsCommand.register(program);
  reposCommand.register(program);
  insightsCommand.register(program);
  pingCommand.register(program);
  labelsCommand.register(program);
  profileCommand.register(program);
  configCommand.register(program);
  prCommand.register(program);
  issueCommand.register(program);
  projectCommand.register(program);
  milestoneCommand.register(program);
  tuiCommand.register(program);
  reviewCommand.register(program);
  workflowCommand.register(program);
  cacheCommand.register(program);
  runCommand.register(program);
  releaseCommand.register(program);

  program
    .command("version")
    .description("Show version number.")
    .action(() => {
      console.log(__VERSION__);
      process.exit(0);
    });

  program.addHelpText("before", ascii);

  program.addHelpText(
    "after",
    `
Examples:
  ghg notifications list
  ghg pr cleanup
  ghg repos report --org airscripts
  ghg labels push
  ghg proxy pr checkout 17
  ghg profile detect
  ghg review threads 42
  ghg milestone progress v2.9.0
  ghg project board 1
  ghg issue subtasks 42
  ghg tui
  ghg workflow validate
  ghg workflow preview
  ghg run debug 123456
  ghg release changelog
  ghg release bump --create --push
  ghg release draft --level minor
`,
  );

  program.exitOverride();

  function handleError(error: unknown): never {
    if (error instanceof TokenRequiredError) {
      output.writeError(error.message, ERROR_NO_TOKEN);
      process.exit(1);
    }

    if (error instanceof RateLimitError) {
      output.writeError(
        error.message,
        `Rate limit resets ${dates.formatRelative(error.resetAt)} (${dates.formatDateShort(error.resetAt)}).`,
      );

      process.exit(1);
    }

    if (error instanceof GhitgudError) {
      output.writeError(error.message);
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
    void program.parseAsync(process.argv).catch(handleError);
  } catch (error) {
    handleError(error);
  }

  process.on("unhandledRejection", (error: unknown) => {
    handleError(error);
  });
}
