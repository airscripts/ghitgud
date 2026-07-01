import client from "@/providers/github/client";

interface DependabotListOptions {
  state?: string;
  scope?: string;
  after?: string;
  before?: string;
  package?: string;
  severity?: string;
  ecosystem?: string;
}

interface DependabotDismissOptions {
  reason: string;
  comment?: string;
}

interface DependabotAlertResponse {
  state: string;
  number: number;

  dependency?: {
    package?: {
      name?: string;
      ecosystem?: string;
    };

    manifest_path?: string;
  };

  security_advisory?: {
    summary?: string;
    severity?: string;
  };

  dismissed_reason?: string | null;
}

function buildEndpoint(repo: string, options: DependabotListOptions): string {
  const params = new URLSearchParams();
  params.set("per_page", String(client.getDefaultPerPage()));

  if (options.state) params.set("state", options.state);
  if (options.scope) params.set("scope", options.scope);
  if (options.after) params.set("after", options.after);
  if (options.before) params.set("before", options.before);
  if (options.package) params.set("package", options.package);
  if (options.severity) params.set("severity", options.severity);
  if (options.ecosystem) params.set("ecosystem", options.ecosystem);

  return `/repos/${repo}/dependabot/alerts?${params.toString()}`;
}

const dependabot = {
  listAlerts: async (
    repo: string,
    options: DependabotListOptions = {},
  ): Promise<DependabotAlertResponse[]> => {
    return client.getPaginated<DependabotAlertResponse>(
      buildEndpoint(repo, options),
    );
  },

  dismissAlert: async (
    repo: string,
    alertNumber: number,
    options: DependabotDismissOptions,
  ): Promise<Response> => {
    return client.patchTokenRequired(
      `/repos/${repo}/dependabot/alerts/${alertNumber}`,
      {
        state: "dismissed",
        dismissed_reason: options.reason,
        ...(options.comment ? { dismissed_comment: options.comment } : {}),
      },
    );
  },
};

export default dependabot;

export type {
  DependabotListOptions,
  DependabotAlertResponse,
  DependabotDismissOptions,
};
