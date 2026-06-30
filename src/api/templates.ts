import client from "./client";

const list = (repo: string): Promise<Response> => {
  return client.getTokenRequired(
    `/repos/${repo}/contents/.github/ISSUE_TEMPLATE`,
  );
};

const get = (repo: string, path: string): Promise<Response> => {
  return client.getTokenRequired(
    `/repos/${repo}/contents/${encodeURIComponent(path)}`,
  );
};

const listPrTemplates = (repo: string): Promise<Response> => {
  return client.getTokenRequired(`/repos/${repo}/contents/.github`);
};

export default { list, get, listPrTemplates };
