import prOperations from "./changes";
import runOperations from "./pipeline-runs";
import orgOperations from "./access-org";
import teamOperations from "./access-team";
import repoOperations from "./repo";
import wikiOperations from "./wiki";
import webhookOperations from "./webhook";
import authOperations from "./auth";
import cacheOperations from "./pipeline-caches";
import gistOperations from "./snippets";
import apiOperations from "./api";
import queueOperations from "./change-queue";
import statusOperations from "./inbox-status";
import rulesetOperations from "./policies";
import auditOperations from "./security-audit";
import leaksOperations from "./security-leaks";
import pagesOperations from "./sites";
import labelOperations from "./labels";
import issueOperations from "./issues";
import searchOperations from "./search";
import reviewOperations from "./review";
import configOperations from "./config";
import utilityOperations from "./utility";
import releaseOperations from "./release";
import secretsOperations from "./secrets";
import projectOperations from "./planning";
import insightsOperations from "./analytics-repo";
import workflowOperations from "./pipeline-definitions";
import variableOperations from "./variables";
import dashboardOperations from "./dashboard";
import milestoneOperations from "./planning-milestones";
import dependabotOperations from "./security-dependencies";
import complianceOperations from "./security-compliance";
import discussionOperations from "./discussions";
import deploymentOperations from "./deployments";
import repositoryOperations from "./repositories";
import environmentOperations from "./environments";
import notificationOperations from "./inbox";
import forkOperations from "./repo-forks";
import branchOperations from "./policy-branches";
import reactionOperations from "./review-reactions";
import commentOperations from "./review-conversations";
import depsOperations from "./dependencies";
import advisoryOperations from "./advisories";
import codeqlOperations from "./security-code";
import workspaceOperations from "./workspaces";
import syncOperations from "./sync";
import actionsOperations from "./analytics-pipeline";
import codeOperations from "./code";
import templateOperations from "./templates";
import packageOperations from "./registries";
import runnerOperations from "./runners";
import codespaceOperations from "./dev";
import browseOperations from "./browse";
import attestationOperations from "./attestations";
import sshKeyOperations from "./identity-ssh";
import gpgKeyOperations from "./identity-gpg";
import licenseOperations from "./licenses";

import type { TuiOperation } from "../types";
import providerRegistry from "@/providers/registry";
import {
  getOperationFamily,
  normalizeOperationCommand,
} from "@/operations/registry";

const sourceOperations: TuiOperation[] = [
  ...dashboardOperations,
  ...notificationOperations,
  ...labelOperations,
  ...prOperations,
  ...reviewOperations,
  ...milestoneOperations,
  ...projectOperations,
  ...issueOperations,
  ...repositoryOperations,
  ...insightsOperations,
  ...workflowOperations,
  ...cacheOperations,
  ...gistOperations,
  ...statusOperations,
  ...rulesetOperations,
  ...apiOperations,
  ...queueOperations,
  ...runOperations,
  ...authOperations,
  ...configOperations,
  ...utilityOperations,
  ...releaseOperations,
  ...discussionOperations,
  ...deploymentOperations,
  ...dependabotOperations,
  ...complianceOperations,
  ...auditOperations,
  ...leaksOperations,
  ...variableOperations,
  ...secretsOperations,
  ...environmentOperations,
  ...orgOperations,
  ...teamOperations,
  ...repoOperations,
  ...pagesOperations,
  ...wikiOperations,
  ...webhookOperations,
  ...searchOperations,
  ...forkOperations,
  ...branchOperations,
  ...reactionOperations,
  ...commentOperations,
  ...depsOperations,
  ...advisoryOperations,
  ...codeqlOperations,
  ...workspaceOperations,
  ...syncOperations,
  ...actionsOperations,
  ...codeOperations,
  ...templateOperations,
  ...packageOperations,
  ...runnerOperations,
  ...codespaceOperations,
  ...browseOperations,
  ...attestationOperations,
  ...sshKeyOperations,
  ...gpgKeyOperations,
  ...licenseOperations,
];

const provider = providerRegistry.get("github");
const operations = sourceOperations
  .map((operation) => ({
    ...operation,
    command: normalizeOperationCommand(operation.command),
    workspace:
      getOperationFamily(
        normalizeOperationCommand(operation.command).split(/\s+/)[1],
      )?.name ?? operation.workspace,
  }))
  .filter((operation) => {
    const familyName = operation.command.split(/\s+/)[1];
    const capability = getOperationFamily(familyName)?.capability;
    return !capability || provider.capabilities()[capability];
  });

const workspaces = Array.from(new Set(operations.map((op) => op.workspace)));

export default operations;
export { workspaces };
