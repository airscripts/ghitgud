import client from "./client";

const sbom = (repo: string): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/dependency-graph/sbom`);

const compare = (repo: string, basehead: string): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/dependency-graph/compare/${encodeURIComponent(basehead)}`,
  );

export default { sbom, compare };
