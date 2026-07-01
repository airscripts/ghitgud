import client from "@/providers/github/client";

interface ActionsListOptions {
  status?: string;
  perPage?: number;
}

const list = (
  repo: string,
  options?: ActionsListOptions,
): Promise<Response> => {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  params.set(
    "per_page",
    String(options?.perPage ?? client.getDefaultPerPage()),
  );
  const query = params.toString();
  return client.getTokenRequired(
    `/repos/${repo}/actions/runs${query ? `?${query}` : ""}`,
  );
};

export default { list };
