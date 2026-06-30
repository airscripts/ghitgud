import client from "./client";

type RunnerTarget = { repo: string } | { org: string };

const basePath = (target: RunnerTarget): string =>
  "repo" in target
    ? `/repos/${target.repo}/actions/runners`
    : `/orgs/${encodeURIComponent(target.org)}/actions/runners`;

const list = (
  target: RunnerTarget,
  options?: { label?: string },
): Promise<Response> => {
  const params = new URLSearchParams();
  if (options?.label) params.set("label", options.label);
  const query = params.toString();
  return client.getTokenRequired(
    `${basePath(target)}${query ? `?${query}` : ""}`,
  );
};

const get = (target: RunnerTarget, runnerId: number): Promise<Response> =>
  client.getTokenRequired(`${basePath(target)}/${runnerId}`);

const remove = (target: RunnerTarget, runnerId: number): Promise<Response> =>
  client.deleteTokenRequired(`${basePath(target)}/${runnerId}`);

const labels = (target: RunnerTarget, runnerId: number): Promise<Response> =>
  client.getTokenRequired(`${basePath(target)}/${runnerId}/labels`);

export default { list, get, remove, labels };
export type { RunnerTarget };
