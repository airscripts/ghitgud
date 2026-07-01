import client from "@/providers/github/client";

const variables = {
  listRepo: async (owner: string, repo: string): Promise<Response> => {
    return client.get(
      `/repos/${owner}/${repo}/actions/variables?per_page=${client.getDefaultPerPage()}`,
    );
  },

  listOrg: async (org: string): Promise<Response> => {
    return client.get(
      `/orgs/${org}/actions/variables?per_page=${client.getDefaultPerPage()}`,
    );
  },

  listEnv: async (
    owner: string,
    repo: string,
    env: string,
  ): Promise<Response> => {
    return client.get(
      `/repos/${owner}/${repo}/environments/${env}/variables?per_page=${client.getDefaultPerPage()}`,
    );
  },

  setRepo: async (
    owner: string,
    repo: string,
    name: string,
    value: string,
  ): Promise<Response> => {
    return client.postTokenRequired(
      `/repos/${owner}/${repo}/actions/variables`,
      { name, value },
    );
  },

  updateRepo: async (
    owner: string,
    repo: string,
    name: string,
    value: string,
  ): Promise<Response> => {
    return client.patchTokenRequired(
      `/repos/${owner}/${repo}/actions/variables/${name}`,
      { name, value },
    );
  },

  setEnv: async (
    owner: string,
    repo: string,
    env: string,
    name: string,
    value: string,
  ): Promise<Response> => {
    return client.postTokenRequired(
      `/repos/${owner}/${repo}/environments/${env}/variables`,
      { name, value },
    );
  },

  updateEnv: async (
    owner: string,
    repo: string,
    env: string,
    name: string,
    value: string,
  ): Promise<Response> => {
    return client.patchTokenRequired(
      `/repos/${owner}/${repo}/environments/${env}/variables/${name}`,
      { name, value },
    );
  },

  setOrg: async (
    org: string,
    name: string,
    value: string,
  ): Promise<Response> => {
    return client.postTokenRequired(`/orgs/${org}/actions/variables`, {
      name,
      value,
    });
  },

  updateOrg: async (
    org: string,
    name: string,
    value: string,
  ): Promise<Response> => {
    return client.patchTokenRequired(`/orgs/${org}/actions/variables/${name}`, {
      name,
      value,
    });
  },

  deleteOrg: async (org: string, name: string): Promise<Response> => {
    return client.deleteTokenRequired(`/orgs/${org}/actions/variables/${name}`);
  },

  deleteRepo: async (
    owner: string,
    repo: string,
    name: string,
  ): Promise<Response> => {
    return client.deleteTokenRequired(
      `/repos/${owner}/${repo}/actions/variables/${name}`,
    );
  },

  deleteEnv: async (
    owner: string,
    repo: string,
    env: string,
    name: string,
  ): Promise<Response> => {
    return client.deleteTokenRequired(
      `/repos/${owner}/${repo}/environments/${env}/variables/${name}`,
    );
  },
};

export default variables;
