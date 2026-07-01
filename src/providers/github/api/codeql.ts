import client from "@/providers/github/client";

const list = (
  repo: string,
  options?: { state?: string; severity?: string },
): Promise<Response> => {
  const params = new URLSearchParams();
  if (options?.state) params.set("state", options.state);
  if (options?.severity) params.set("severity", options.severity);
  params.set("per_page", String(client.getDefaultPerPage()));
  const query = params.toString();
  return client.getTokenRequired(
    `/repos/${repo}/code-scanning/alerts${query ? `?${query}` : ""}`,
  );
};

const get = (repo: string, alertNumber: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/code-scanning/alerts/${alertNumber}`);

const update = (
  repo: string,
  alertNumber: number,
  data: {
    state: string;
    dismissed_reason?: string;
    dismissed_comment?: string;
  },
): Promise<Response> =>
  client.patchTokenRequired(
    `/repos/${repo}/code-scanning/alerts/${alertNumber}`,
    data,
  );

export default { list, get, update };
