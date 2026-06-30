import client from "./client";

const list = (
  repo: string,
  options?: { environment?: string; limit?: number },
): Promise<Response> => {
  const params = new URLSearchParams();
  if (options?.environment) params.set("environment", options.environment);
  params.set("per_page", String(options?.limit ?? 30));
  return client.getTokenRequired(
    `/repos/${repo}/deployments?${params.toString()}`,
  );
};

const get = (repo: string, id: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/deployments/${id}`);

const create = (
  repo: string,
  input: {
    ref: string;
    environment: string;
    description?: string;
    auto_merge?: boolean;
  },
): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/deployments`, input);

const statuses = (repo: string, id: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/deployments/${id}/statuses`);

const createStatus = (
  repo: string,
  id: number,
  input: {
    state: string;
    description?: string;
    target_url?: string;
  },
): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/deployments/${id}/statuses`, input);

export default { list, get, create, statuses, createStatus };
