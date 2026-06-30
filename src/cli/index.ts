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
import authCommand from "@/commands/auth";
import pingCommand from "@/commands/ping";
import teamCommand from "@/commands/team";
import repoCommand from "@/commands/repo";
import forkCommand from "@/commands/fork";
import wikiCommand from "@/commands/wiki";
import webhookCommand from "@/commands/webhook";
import issueCommand from "@/commands/issue";
import proxyCommand from "@/commands/proxy";
import reposCommand from "@/commands/repos";
import cacheCommand from "@/commands/cache";
import gistCommand from "@/commands/gist";
import apiCommand from "@/commands/api";
import queueCommand from "@/commands/queue";
import statusCommand from "@/commands/status";
import rulesetCommand from "@/commands/ruleset";
import auditCommand from "@/commands/audit";
import leaksCommand from "@/commands/leaks";
import pagesCommand from "@/commands/pages";
import labelsCommand from "@/commands/labels";
import searchCommand from "@/commands/search";
import outputState from "@/core/output-state";
import configCommand from "@/commands/config";
import secretCommand from "@/commands/secret";
import reviewCommand from "@/commands/review";
import projectCommand from "@/commands/project";
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
import deploymentCommand from "@/commands/deployment";
import branchCommand from "@/commands/branch";
import reactCommand from "@/commands/react";
import commentCommand from "@/commands/comment";
import depsCommand from "@/commands/deps";
import advisoryCommand from "@/commands/advisory";
import codeqlCommand from "@/commands/codeql";
import workspaceCommand from "@/commands/workspace";
import actionsCommand from "@/commands/actions";
import codeCommand from "@/commands/code";
import templateCommand from "@/commands/template";
import packageCommand from "@/commands/package";
import runnerCommand from "@/commands/runner";
import extensionCommand from "@/commands/extension";
import codespaceCommand from "@/commands/codespace";
import browseCommand from "@/commands/browse";
import attestationCommand from "@/commands/attestation";
import sshKeyCommand from "@/commands/ssh-key";
import gpgKeyCommand from "@/commands/gpg-key";
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
    authCommand.register(program);
    notificationsCommand.register(program);
    activityCommand.register(program);
    mentionsCommand.register(program);
    reposCommand.register(program);
    insightsCommand.register(program);
    pingCommand.register(program);
    labelsCommand.register(program);
    pagesCommand.register(program);
    wikiCommand.register(program);
    webhookCommand.register(program);
    configCommand.register(program);
    prCommand.register(program);
    issueCommand.register(program);
    projectCommand.register(program);
    milestoneCommand.register(program);
    tuiCommand.register(program);
    reviewCommand.register(program);
    workflowCommand.register(program);
    cacheCommand.register(program);
    gistCommand.register(program);
    apiCommand.register(program);
    statusCommand.register(program);
    rulesetCommand.register(program);
    queueCommand.register(program);
    runCommand.register(program);
    releaseCommand.register(program);
    searchCommand.register(program);
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
    deploymentCommand.register(program);
    forkCommand.register(program);
    branchCommand.register(program);
    reactCommand.register(program);
    commentCommand.register(program);
    depsCommand.register(program);
    advisoryCommand.register(program);
    codeqlCommand.register(program);
    workspaceCommand.register(program);
    actionsCommand.register(program);
    codeCommand.register(program);
    templateCommand.register(program);
    packageCommand.register(program);
    runnerCommand.register(program);
    extensionCommand.register(program);
    codespaceCommand.register(program);
    browseCommand.register(program);
    attestationCommand.register(program);
    sshKeyCommand.register(program);
    gpgKeyCommand.register(program);

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
  ghg auth login --token ghp_xxx
  ghg auth status
  ghg notifications list
  ghg pr create --title "Add feature"
  ghg pr checks 42
  ghg pr cleanup
  ghg repos report --org airscripts
  ghg labels push
  ghg proxy pr checkout 17
  ghg auth login --token ghp_xxx
  ghg review threads 42
  ghg milestone progress v2.10.0
  ghg project board 1
  ghg issue create --title "Bug report" --label bug
  ghg issue list --state open
  ghg issue subtasks 42
  ghg tui
  ghg workflow validate
  ghg workflow preview
  ghg workflow list
  ghg cache list
  ghg gist create notes.txt
  ghg project list --owner airscripts
  ghg ruleset validate --file ruleset.yml
  ghg status --org airscripts
  ghg api /user --jq .login
  ghg queue status --repo airscripts/ghitgud
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
  ghg search issues "memory leak" --repo owner/repo --state open
  ghg search prs "fix typo" --repo owner/repo
  ghg search repos "typescript framework" --language typescript
  ghg search code "useEffect" --repo owner/repo
  ghg search commits "feat: add search" --repo owner/repo
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
