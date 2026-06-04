import prOperations from "./prs";
import runOperations from "./run";
import cacheOperations from "./cache";
import labelOperations from "./labels";
import issueOperations from "./issues";
import reviewOperations from "./review";
import configOperations from "./config";
import profileOperations from "./profile";
import utilityOperations from "./utility";
import releaseOperations from "./release";
import projectOperations from "./projects";
import insightsOperations from "./insights";
import workflowOperations from "./workflow";
import dashboardOperations from "./dashboard";
import milestoneOperations from "./milestones";
import repositoryOperations from "./repositories";
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
  ...profileOperations,
  ...configOperations,
  ...utilityOperations,
  ...releaseOperations,
];

const workspaces = Array.from(new Set(operations.map((op) => op.workspace)));

export default operations;
export { workspaces };
