import client from "./client";

interface AdvisoryListOptions {
  ecosystem?: string;
  severity?: string;
  state?: string;
  perPage?: number;
}

const list = (options?: AdvisoryListOptions): Promise<Response> => {
  const params = new URLSearchParams();
  if (options?.ecosystem) params.set("ecosystem", options.ecosystem);
  if (options?.severity) params.set("severity", options.severity);
  if (options?.perPage) params.set("per_page", String(options.perPage));
  const query = params.toString();
  return client.getTokenRequired(`/advisories${query ? `?${query}` : ""}`);
};

const get = (ghsaId: string): Promise<Response> =>
  client.getTokenRequired(`/advisories/${encodeURIComponent(ghsaId)}`);

const listRepo = (
  repo: string,
  options?: { state?: string; severity?: string; ecosystem?: string },
): Promise<Response> => {
  const params = new URLSearchParams();
  if (options?.state) params.set("state", options.state);
  if (options?.severity) params.set("severity", options.severity);
  if (options?.ecosystem) params.set("ecosystem", options.ecosystem);
  const query = params.toString();
  return client.getTokenRequired(
    `/repos/${repo}/security-advisories${query ? `?${query}` : ""}`,
  );
};

const getRepo = (repo: string, ghsaId: string): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/security-advisories/${encodeURIComponent(ghsaId)}`,
  );

const create = (
  repo: string,
  data: {
    summary: string;
    description: string;
    severity: string;
    cveId?: string;
    vulnerableVersionRange?: string;
    patchedVersionRange?: string;
  },
): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/security-advisories`, data);

const update = (
  repo: string,
  ghsaId: string,
  data: {
    state?: string;
    severity?: string;
    summary?: string;
    description?: string;
  },
): Promise<Response> =>
  client.patchTokenRequired(
    `/repos/${repo}/security-advisories/${encodeURIComponent(ghsaId)}`,
    data,
  );

const requestCve = (repo: string, ghsaId: string): Promise<Response> =>
  client.postTokenRequired(
    `/repos/${repo}/security-advisories/${encodeURIComponent(ghsaId)}/cve`,
    {},
  );

export default { list, get, listRepo, getRepo, create, update, requestCve };
