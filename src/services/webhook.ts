import api from "@/api/webhooks";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";

interface WebhookApiEntry {
  id: number;
  name?: string;
  url?: string;
  active?: boolean;
  events?: string[];
  created_at?: string;
  updated_at?: string;
  config?: { url?: string; content_type?: string; secret?: string };
}

interface WebhookDeliveryApiEntry {
  id: number;
  guid?: string;
  delivered_at?: string;
  status?: string;
  status_code?: number;
  duration?: number;
  event?: string;
  action?: string | null;
  request?: { headers?: Record<string, string>; payload?: unknown };
  response?: { headers?: Record<string, string>; body?: string } | null;
}

const normalizeWebhook = (entry: WebhookApiEntry) => ({
  id: entry.id,
  name: entry.name ?? "web",
  url: entry.config?.url ?? entry.url ?? "",
  events: entry.events ?? [],
  active: entry.active ?? true,
  createdAt: entry.created_at ?? "",
  updatedAt: entry.updated_at ?? "",
});

const normalizeDelivery = (entry: WebhookDeliveryApiEntry) => ({
  id: entry.id,
  guid: entry.guid ?? "",
  deliveredAt: entry.delivered_at ?? "",
  statusCode: entry.status_code ?? 0,
  duration: entry.duration ?? 0,
  event: entry.event ?? "",
  action: entry.action ?? null,
});

const list = async (options: { repo?: string } = {}) => {
  logger.start("Loading webhooks...");
  const repo = await repoResolver.resolveRepo(options.repo);
  const response = await api.list(repo);
  const webhooks = (await response.json()) as WebhookApiEntry[];
  const normalized = webhooks.map(normalizeWebhook);
  output.renderTable(
    normalized.map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      events: w.events.join(", "),
      active: w.active ? "yes" : "no",
    })),
    { emptyMessage: "No webhooks found." },
  );
  logger.success(`Loaded ${normalized.length} webhooks.`);
  return { success: true, webhooks: normalized };
};

const listOrg = async (org: string) => {
  logger.start("Loading organization webhooks...");
  const response = await api.listOrg(org);
  const webhooks = (await response.json()) as WebhookApiEntry[];
  const normalized = webhooks.map(normalizeWebhook);
  output.renderTable(
    normalized.map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      events: w.events.join(", "),
      active: w.active ? "yes" : "no",
    })),
    { emptyMessage: "No webhooks found." },
  );
  logger.success(`Loaded ${normalized.length} webhooks.`);
  return { success: true, webhooks: normalized };
};

const create = async (options: {
  repo?: string;
  org?: string;
  url: string;
  events: string[];
  secret?: string;
  contentType?: string;
  active?: boolean;
}) => {
  logger.start("Creating webhook...");
  const input: {
    name?: string;
    url: string;
    events: string[];
    active?: boolean;
    config?: { content_type?: string; secret?: string };
  } = {
    url: options.url,
    events: options.events,
    active: options.active ?? true,
  };

  if (options.secret || options.contentType) {
    input.config = {};
    if (options.secret) input.config.secret = options.secret;
    if (options.contentType) input.config.content_type = options.contentType;
  }

  let response: Response;
  if (options.org) {
    response = await api.createOrg(options.org, input);
  } else {
    const repo = await repoResolver.resolveRepo(options.repo);
    response = await api.create(repo, input);
  }

  const webhook = normalizeWebhook((await response.json()) as WebhookApiEntry);
  output.renderKeyValues([
    ["ID", webhook.id],
    ["Name", webhook.name],
    ["URL", webhook.url],
    ["Events", webhook.events.join(", ")],
    ["Active", webhook.active ? "yes" : "no"],
  ]);
  logger.success(`Created webhook ${webhook.id}.`);
  return { success: true, webhook };
};

const edit = async (options: {
  repo?: string;
  id: number;
  url?: string;
  events?: string[];
  active?: boolean;
}) => {
  logger.start("Updating webhook...");
  const repo = await repoResolver.resolveRepo(options.repo);
  const input: { url?: string; events?: string[]; active?: boolean } = {};
  if (options.url) input.url = options.url;
  if (options.events) input.events = options.events;
  if (options.active !== undefined) input.active = options.active;

  const response = await api.update(repo, options.id, input);
  const webhook = normalizeWebhook((await response.json()) as WebhookApiEntry);
  output.renderKeyValues([
    ["ID", webhook.id],
    ["Name", webhook.name],
    ["URL", webhook.url],
    ["Events", webhook.events.join(", ")],
    ["Active", webhook.active ? "yes" : "no"],
  ]);
  logger.success(`Updated webhook ${options.id}.`);
  return { success: true, webhook };
};

const remove = async (options: { repo?: string; id: number }) => {
  logger.start("Deleting webhook...");
  const repo = await repoResolver.resolveRepo(options.repo);
  await api.remove(repo, options.id);
  logger.success(`Deleted webhook ${options.id}.`);
  return { success: true, webhook: options.id };
};

const test = async (options: { repo?: string; id: number }) => {
  logger.start("Triggering test ping...");
  const repo = await repoResolver.resolveRepo(options.repo);
  await api.test(repo, options.id);
  logger.success(`Test ping sent for webhook ${options.id}.`);
  return { success: true, webhook: options.id };
};

const deliveries = async (options: { repo?: string; id: number }) => {
  logger.start("Loading deliveries...");
  const repo = await repoResolver.resolveRepo(options.repo);
  const response = await api.deliveries(repo, options.id);
  const rawDeliveries = (await response.json()) as WebhookDeliveryApiEntry[];
  const normalized = rawDeliveries.map(normalizeDelivery);
  output.renderTable(
    normalized.map((d) => ({
      id: d.id,
      event: d.event,
      action: d.action ?? "-",
      status: d.statusCode,
      delivered: d.deliveredAt,
    })),
    { emptyMessage: "No deliveries found." },
  );
  logger.success(`Loaded ${normalized.length} deliveries.`);
  return { success: true, deliveries: normalized };
};

const delivery = async (options: {
  repo?: string;
  id: number;
  deliveryId: number;
}) => {
  logger.start("Loading delivery details...");
  const repo = await repoResolver.resolveRepo(options.repo);
  const response = await api.delivery(repo, options.id, options.deliveryId);
  const raw = (await response.json()) as WebhookDeliveryApiEntry;
  const normalized = normalizeDelivery(raw);
  output.renderKeyValues([
    ["ID", normalized.id],
    ["GUID", normalized.guid],
    ["Event", normalized.event],
    ["Action", normalized.action ?? "-"],
    ["Status", normalized.statusCode],
    ["Duration", normalized.duration],
    ["Delivered", normalized.deliveredAt],
  ]);
  logger.success("Loaded delivery details.");
  return { success: true, delivery: normalized };
};

const redeliver = async (options: {
  repo?: string;
  id: number;
  deliveryId: number;
}) => {
  logger.start("Redelivering webhook delivery...");
  const repo = await repoResolver.resolveRepo(options.repo);
  await api.redeliver(repo, options.id, options.deliveryId);
  logger.success(`Redelivery requested for delivery ${options.deliveryId}.`);
  return { success: true, delivery: options.deliveryId };
};

export default {
  list,
  listOrg,
  create,
  edit,
  remove,
  test,
  deliveries,
  delivery,
  redeliver,
};
