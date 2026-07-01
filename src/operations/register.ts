import type { Command } from "commander";

import { GitfleetError } from "@/core/errors";
import accessOrg from "@/commands/access-org";
import accessTeam from "@/commands/access-team";
import advisory from "@/commands/advisory";
import alias from "@/commands/alias";
import analyticsPipeline from "@/commands/analytics-pipeline";
import analyticsRepository from "@/commands/analytics-repo";
import api from "@/commands/api";
import attestation from "@/commands/attestation";
import auth from "@/commands/auth";
import browse from "@/commands/browse";
import change from "@/commands/change";
import changeQueue from "@/commands/change-queue";
import code from "@/commands/code";
import completion from "@/commands/completion";
import config from "@/commands/config";
import deps from "@/commands/deps";
import deploy from "@/commands/deploy";
import dev from "@/commands/dev";
import discussion from "@/commands/discussion";
import environment from "@/commands/environment";
import govern from "@/commands/govern";
import identityGpg from "@/commands/identity-gpg";
import identitySsh from "@/commands/identity-ssh";
import inboxActivity from "@/commands/inbox-activity";
import inboxMentions from "@/commands/inbox-mentions";
import inboxNotifications from "@/commands/inbox-notifications";
import inboxStatus from "@/commands/inbox-status";
import issue from "@/commands/issue";
import label from "@/commands/label";
import license from "@/commands/license";
import pipelineCache from "@/commands/pipeline-cache";
import pipelineDefinition from "@/commands/pipeline-definition";
import pipelineRun from "@/commands/pipeline-run";
import planning from "@/commands/planning";
import planningMilestone from "@/commands/planning-milestone";
import policy from "@/commands/policy";
import policyBranch from "@/commands/policy-branch";
import registry from "@/commands/registry";
import release from "@/commands/release";
import repo from "@/commands/repo";
import repoForks from "@/commands/repo-forks";
import review from "@/commands/review";
import reviewConversation from "@/commands/review-conversation";
import reviewReaction from "@/commands/review-reaction";
import runner from "@/commands/runner";
import search from "@/commands/search";
import secret from "@/commands/secret";
import securityAudit from "@/commands/security-audit";
import securityCodeql from "@/commands/security-codeql";
import securityCompliance from "@/commands/security-compliance";
import securityDependabot from "@/commands/security-dependabot";
import securityLeaks from "@/commands/security-leaks";
import site from "@/commands/site";
import snippet from "@/commands/snippet";
import template from "@/commands/template";
import tui from "@/commands/tui";
import variable from "@/commands/variable";
import webhook from "@/commands/webhook";
import wiki from "@/commands/wiki";
import workspace from "@/commands/workspace";

const registrations = [
  alias,
  completion,
  auth,
  inboxNotifications,
  inboxActivity,
  inboxMentions,
  govern,
  analyticsRepository,
  label,
  license,
  site,
  wiki,
  webhook,
  config,
  change,
  issue,
  planning,
  planningMilestone,
  tui,
  review,
  pipelineDefinition,
  pipelineCache,
  snippet,
  api,
  inboxStatus,
  policy,
  changeQueue,
  pipelineRun,
  release,
  search,
  securityAudit,
  securityLeaks,
  securityDependabot,
  securityCompliance,
  discussion,
  variable,
  secret,
  environment,
  accessOrg,
  accessTeam,
  repo,
  deploy,
  repoForks,
  policyBranch,
  reviewReaction,
  reviewConversation,
  deps,
  advisory,
  securityCodeql,
  workspace,
  analyticsPipeline,
  code,
  template,
  registry,
  runner,
  dev,
  browse,
  attestation,
  identitySsh,
  identityGpg,
] as const;

export function registerOperations(program: Command): void {
  for (const registration of registrations) {
    registration.register(program);
  }

  program
    .command("help [command...]")
    .description("Show help for Gitfleet or a command.")
    .action((path: string[] = []) => {
      let target = program;

      for (const segment of path) {
        const child = target.commands.find(
          (candidate) => candidate.name() === segment,
        );
        if (!child) {
          throw new GitfleetError(`Unknown command path: ${path.join(" ")}.`);
        }
        target = child;
      }

      target.configureOutput(program.configureOutput());
      target.outputHelp();
    });
}
