import client from "./client";

interface AdvisoryListOptions {
  ecosystem?: string;
  severity?: string;
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

export default { list, get };
