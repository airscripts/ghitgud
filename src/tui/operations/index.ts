import prOperations from "./prs";
import runOperations from "./run";
import orgOperations from "./org";
import teamOperations from "./team";
import repoOperations from "./repo";
import wikiOperations from "./wiki";
import authOperations from "./auth";
import cacheOperations from "./cache";
import auditOperations from "./audit";
import leaksOperations from "./leaks";
import pagesOperations from "./pages";
import labelOperations from "./labels";
import issueOperations from "./issues";
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
import repositoryOperations from "./repositories";
import environmentOperations from "./environments";
import notificationOperations from "./notifications";

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
  ...runOperations,
  ...authOperations,
  ...configOperations,
  ...utilityOperations,
  ...releaseOperations,
  ...discussionOperations,
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
];

const workspaces = Array.from(new Set(operations.map((op) => op.workspace)));

export default operations;
export { workspaces };
