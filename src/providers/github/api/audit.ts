import client from "@/providers/github/client";

interface AuditListOptions {
  org?: string;
  repo?: string;
  order?: string;
  actor?: string;
  after?: string;
  action?: string;
  before?: string;
  include?: string;
  enterprise?: string;
}

interface AuditLogResponse {
  repo?: string;
  actor?: string;
  action?: string;
  repository?: string;
  actor_login?: string;
  _document_id?: string;
  [key: string]: unknown;
  "@timestamp"?: number | string;
}

function buildPhrase(options: AuditListOptions): string | undefined {
  const parts = [
    options.actor ? `actor:${options.actor}` : null,
    options.action ? `action:${options.action}` : null,
    options.repo ? `repo:${options.repo}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" ") : undefined;
}

function buildEndpoint(base: string, options: AuditListOptions): string {
  const params = new URLSearchParams();
  params.set("per_page", String(client.getDefaultPerPage()));

  const phrase = buildPhrase(options);
  if (phrase) params.set("phrase", phrase);
  if (options.after) params.set("after", options.after);
  if (options.before) params.set("before", options.before);
  if (options.include) params.set("include", options.include);
  if (options.order) params.set("order", options.order);

  return `${base}?${params.toString()}`;
}

const audit = {
  list: async (options: AuditListOptions): Promise<AuditLogResponse[]> => {
    const base = options.enterprise
      ? `/enterprises/${options.enterprise}/audit-log`
      : `/orgs/${options.org}/audit-log`;

    return client.getPaginated<AuditLogResponse>(buildEndpoint(base, options));
  },
};

export default audit;
export type { AuditListOptions, AuditLogResponse };
