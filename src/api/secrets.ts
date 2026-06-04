import client from "./client";

interface SecretAlertsOptions {
  state?: string;
  after?: string;
  before?: string;
  resolution?: string;
  secretType?: string;
}

interface SecretScanningAlertResponse {
  state: string;
  number: number;
  html_url?: string;
  created_at: string;
  secret_type: string;
  resolution: string | null;
  resolved_at: string | null;
  secret_type_display_name: string;
}

function buildEndpoint(repo: string, options: SecretAlertsOptions): string {
  const params = new URLSearchParams();
  params.set("per_page", String(client.getDefaultPerPage()));

  if (options.state) params.set("state", options.state);
  if (options.after) params.set("after", options.after);
  if (options.before) params.set("before", options.before);
  if (options.resolution) params.set("resolution", options.resolution);
  if (options.secretType) params.set("secret_type", options.secretType);

  return `/repos/${repo}/secret-scanning/alerts?${params.toString()}`;
}

const secrets = {
  listAlerts: async (
    repo: string,
    options: SecretAlertsOptions = {},
  ): Promise<SecretScanningAlertResponse[]> => {
    return client.getPaginated<SecretScanningAlertResponse>(
      buildEndpoint(repo, options),
    );
  },
};

export default secrets;
export type { SecretAlertsOptions, SecretScanningAlertResponse };
