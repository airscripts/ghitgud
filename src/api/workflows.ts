import client from "./client";

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

export default {
  getRun,
  listRunJobs,
  downloadRunLogs,
};
