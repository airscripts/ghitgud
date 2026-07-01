import client from "@/providers/github/client";

const list = (repo: string): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/hooks`);

const listOrg = (org: string): Promise<Response> =>
  client.getTokenRequired(`/orgs/${org}/hooks`);

const get = (repo: string, id: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/hooks/${id}`);

const create = (repo: string, input: WebhookCreateInput): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/hooks`, input);

const createOrg = (org: string, input: WebhookCreateInput): Promise<Response> =>
  client.postTokenRequired(`/orgs/${org}/hooks`, input);

const update = (
  repo: string,
  id: number,
  input: WebhookUpdateInput,
): Promise<Response> =>
  client.patchTokenRequired(`/repos/${repo}/hooks/${id}`, input);

const remove = (repo: string, id: number): Promise<Response> =>
  client.deleteTokenRequired(`/repos/${repo}/hooks/${id}`);

const test = (repo: string, id: number): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/hooks/${id}/tests`, {});

const deliveries = (repo: string, id: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/hooks/${id}/deliveries`);

const delivery = (
  repo: string,
  id: number,
  deliveryId: number,
): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/hooks/${id}/deliveries/${deliveryId}`,
  );

const redeliver = (
  repo: string,
  id: number,
  deliveryId: number,
): Promise<Response> =>
  client.postTokenRequired(
    `/repos/${repo}/hooks/${id}/deliveries/${deliveryId}/attempts`,
    {},
  );

interface WebhookCreateInput {
  name?: string;
  url: string;
  events: string[];
  active?: boolean;
  config?: {
    content_type?: string;
    secret?: string;
  };
}

interface WebhookUpdateInput {
  url?: string;
  events?: string[];
  active?: boolean;
  config?: {
    content_type?: string;
    secret?: string;
  };
}

export default {
  list,
  listOrg,
  get,
  create,
  createOrg,
  update,
  remove,
  test,
  deliveries,
  delivery,
  redeliver,
};
export type { WebhookCreateInput, WebhookUpdateInput };
