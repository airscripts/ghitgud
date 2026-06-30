import prOperations from "./prs";
import runOperations from "./run";
import orgOperations from "./org";
import teamOperations from "./team";
import repoOperations from "./repo";
import wikiOperations from "./wiki";
import webhookOperations from "./webhook";
import authOperations from "./auth";
import cacheOperations from "./cache";
import gistOperations from "./gists";
import apiOperations from "./api";
import queueOperations from "./queue";
import statusOperations from "./status";
import rulesetOperations from "./rulesets";
import auditOperations from "./audit";
import leaksOperations from "./leaks";
import pagesOperations from "./pages";
import labelOperations from "./labels";
import issueOperations from "./issues";
import searchOperations from "./search";
import reviewOperations from "./review";
import configOperations from "./config";
import utilityOperations from "./utility";
import releaseOperations from "./release";
import secretsOperations from "./secrets";
import projectOperations from "./projects";
import insightsOperations from "./insights";
import workflowOperations from "./workflow";
import variableOperations from "./variables";
import dashboardOperations from "./dashboard";
import milestoneOperations from "./milestones";
import dependabotOperations from "./dependabot";
import complianceOperations from "./compliance";
import discussionOperations from "./discussions";
import deploymentOperations from "./deployments";
import repositoryOperations from "./repositories";
import environmentOperations from "./environments";
import notificationOperations from "./notifications";
import forkOperations from "./forks";
import branchOperations from "./branches";
import reactionOperations from "./reactions";
import commentOperations from "./comments";
import depsOperations from "./dependencies";
import advisoryOperations from "./advisories";
import codeqlOperations from "./codeql";
import workspaceOperations from "./workspaces";
import syncOperations from "./sync";
import actionsOperations from "./actions";
import codeOperations from "./code";
import templateOperations from "./templates";
import packageOperations from "./packages";
import runnerOperations from "./runners";
import extensionOperations from "./extensions";
import codespaceOperations from "./codespaces";
import browseOperations from "./browse";
import attestationOperations from "./attestations";
import sshKeyOperations from "./ssh-keys";
import gpgKeyOperations from "./gpg-keys";

import type { TuiOperation } from "../types";

const operations: TuiOperation[] = [
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
  ...extensionOperations,
  ...codespaceOperations,
  ...browseOperations,
  ...attestationOperations,
  ...sshKeyOperations,
  ...gpgKeyOperations,
];

const workspaces = Array.from(new Set(operations.map((op) => op.workspace)));

export default operations;
export { workspaces };
