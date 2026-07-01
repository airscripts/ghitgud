import client from "@/providers/github/client";

const listCaches = async (
  repo: string,
  key?: string,
  limit = client.getDefaultPerPage(),
  page = 1,
): Promise<Response> => {
  const query = new URLSearchParams();
  if (key) query.set("key", key);
  query.set("per_page", String(limit));
  if (page > 1) query.set("page", String(page));

  return client.getTokenRequired(`/repos/${repo}/actions/caches?${query}`);
};

const deleteCache = (repo: string, id: number): Promise<Response> =>
  client.deleteTokenRequired(`/repos/${repo}/actions/caches/${id}`);

export default { deleteCache, listCaches };
