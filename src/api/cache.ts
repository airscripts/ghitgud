import client from "./client";

const listCaches = async (repo: string, key: string): Promise<Response> => {
  const query = new URLSearchParams();
  query.set("key", key);
  query.set("per_page", String(client.getDefaultPerPage()));

  return client.getTokenRequired(`/repos/${repo}/actions/caches?${query}`);
};

export default { listCaches };
