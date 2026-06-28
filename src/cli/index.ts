import process from "process";
import { program } from "commander";

import pc from "picocolors";
import ascii from "./ascii";
import dates from "@/core/dates";
import output from "@/core/output";
import logger from "@/core/logger";
import prCommand from "@/commands/pr";
import tuiCommand from "@/commands/tui";
import runCommand from "@/commands/run";
import orgCommand from "@/commands/org";
import pingCommand from "@/commands/ping";
import teamCommand from "@/commands/team";
import repoCommand from "@/commands/repo";
import wikiCommand from "@/commands/wiki";
import issueCommand from "@/commands/issue";
import proxyCommand from "@/commands/proxy";
import reposCommand from "@/commands/repos";
import cacheCommand from "@/commands/cache";
import auditCommand from "@/commands/audit";
import leaksCommand from "@/commands/leaks";
import pagesCommand from "@/commands/pages";
import labelsCommand from "@/commands/labels";
import outputState from "@/core/output-state";
import configCommand from "@/commands/config";
import secretCommand from "@/commands/secret";
import reviewCommand from "@/commands/review";
import projectCommand from "@/commands/project";
import profileCommand from "@/commands/profile";
import releaseCommand from "@/commands/release";
import insightsCommand from "@/commands/insights";
import mentionsCommand from "@/commands/mentions";
import workflowCommand from "@/commands/workflow";
import activityCommand from "@/commands/activity";
import { ERROR_NO_TOKEN } from "@/core/constants";
import variableCommand from "@/commands/variable";
import milestoneCommand from "@/commands/milestone";
import dependabotCommand from "@/commands/dependabot";
import complianceCommand from "@/commands/compliance";
import discussionCommand from "@/commands/discussion";
import environmentCommand from "@/commands/environment";
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

    proxyCommand.register(program);
    notificationsCommand.register(program);
    activityCommand.register(program);
    mentionsCommand.register(program);
    reposCommand.register(program);
    insightsCommand.register(program);
    pingCommand.register(program);
    labelsCommand.register(program);
    profileCommand.register(program);
    pagesCommand.register(program);
    wikiCommand.register(program);
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
    auditCommand.register(program);
    leaksCommand.register(program);
    dependabotCommand.register(program);
    complianceCommand.register(program);
    discussionCommand.register(program);
    variableCommand.register(program);
    secretCommand.register(program);
    environmentCommand.register(program);
    orgCommand.register(program);
    teamCommand.register(program);
    repoCommand.register(program);

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
  ghg notifications list
  ghg pr cleanup
  ghg repos report --org airscripts
  ghg labels push
  ghg proxy pr checkout 17
  ghg profile detect
  ghg review threads 42
  ghg milestone progress v2.10.0
  ghg project board 1
  ghg issue subtasks 42
  ghg tui
  ghg workflow validate
  ghg workflow preview
  ghg run debug 123456
  ghg release changelog
  ghg release bump --create --push
  ghg release draft --level minor
  ghg audit --org airscripts --actor octocat
  ghg leaks alerts --repos owner/repo
  ghg dependabot list --severity high
  ghg compliance check --org airscripts
  ghg variable list --env production
  ghg secret set --name API_KEY --value abc123
  ghg environment create --name staging
  ghg pages deploy --source main --path /docs
  ghg wiki view Home
  ghg org members --org airscripts
  ghg team list --org airscripts
  ghg repo invite --user octocat --role push
  ghg repo grant --team ops --role admin
`,
    );

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

      if (error instanceof GhitgudError) {
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
