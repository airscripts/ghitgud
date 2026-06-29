import client from "./client";

interface RunFilters {
  limit: number;
  branch?: string;
  status?: string;
  workflow?: string;
}

const listRuns = async (
  repo: string,
  filters: RunFilters,
): Promise<Response> => {
  const query = new URLSearchParams({ per_page: String(filters.limit) });
  if (filters.branch) query.set("branch", filters.branch);
  if (filters.status) query.set("status", filters.status);

  const root = filters.workflow
    ? `/repos/${repo}/actions/workflows/${encodeURIComponent(filters.workflow)}/runs`
    : `/repos/${repo}/actions/runs`;

  return client.getTokenRequired(`${root}?${query}`);
};

const getRun = async (repo: string, runId: number): Promise<Response> => {
  return client.getTokenRequired(`/repos/${repo}/actions/runs/${runId}`);
};

const listRunJobs = async (repo: string, runId: number): Promise<Response> => {
  return client.getTokenRequired(`/repos/${repo}/actions/runs/${runId}/jobs`);
};

const downloadRunLogs = async (
  repo: string,
  runId: number,
): Promise<Response> => {
  return client.getTokenRequired(`/repos/${repo}/actions/runs/${runId}/logs`);
};

const cancelRun = (repo: string, runId: number): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/actions/runs/${runId}/cancel`, {});

const rerun = (
  repo: string,
  runId: number,
  failedJobs = false,
): Promise<Response> =>
  client.postTokenRequired(
    `/repos/${repo}/actions/runs/${runId}/${failedJobs ? "rerun-failed-jobs" : "rerun"}`,
    {},
  );

const deleteRun = (repo: string, runId: number): Promise<Response> =>
  client.deleteTokenRequired(`/repos/${repo}/actions/runs/${runId}`);

export default {
  rerun,
  getRun,
  listRuns,
  cancelRun,
  deleteRun,
  listRunJobs,
  downloadRunLogs,
};
