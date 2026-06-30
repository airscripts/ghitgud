import client from "./client";

const getOrgUsage = (org: string): Promise<Response> =>
  client.getTokenRequired(`/orgs/${org}/settings/billing/actions`);

const getRunTiming = (repo: string, runId: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/actions/runs/${runId}/timing`);

const getWorkflowTiming = (
  repo: string,
  workflowId: number,
): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/actions/workflows/${workflowId}/timing`,
  );

export default { getOrgUsage, getRunTiming, getWorkflowTiming };
