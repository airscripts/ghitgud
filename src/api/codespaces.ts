import client from "./client";

const list = (options?: { perPage?: number }): Promise<Response> => {
  const params = new URLSearchParams();
  if (options?.perPage) params.set("per_page", String(options.perPage));
  const query = params.toString();
  return client.getTokenRequired(`/user/codespaces${query ? `?${query}` : ""}`);
};

const get = (codespaceId: string): Promise<Response> =>
  client.getTokenRequired(
    `/user/codespaces/${encodeURIComponent(codespaceId)}`,
  );

const create = (
  repo: string,
  data: {
    ref?: string;
    machine?: string;
    idleTimeoutMinutes?: number;
  },
): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/codespaces`, data);

const start = (codespaceId: string): Promise<Response> =>
  client.postTokenRequired(
    `/user/codespaces/${encodeURIComponent(codespaceId)}/start`,
    {},
  );

const stop = (codespaceId: string): Promise<Response> =>
  client.postTokenRequired(
    `/user/codespaces/${encodeURIComponent(codespaceId)}/stop`,
    {},
  );

const deleteCs = (codespaceId: string): Promise<Response> =>
  client.deleteTokenRequired(
    `/user/codespaces/${encodeURIComponent(codespaceId)}`,
  );

export default { list, get, create, start, stop, delete: deleteCs };
