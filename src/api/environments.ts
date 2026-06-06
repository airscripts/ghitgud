import client from "./client";

const environments = {
  list: async (owner: string, repo: string): Promise<Response> => {
    return client.get(
      `/repos/${owner}/${repo}/environments?per_page=${client.getDefaultPerPage()}`,
    );
  },

  get: async (owner: string, repo: string, name: string): Promise<Response> => {
    return client.get(`/repos/${owner}/${repo}/environments/${name}`);
  },

  create: async (
    owner: string,
    repo: string,
    name: string,
    waitTimer?: number,
  ): Promise<Response> => {
    return client.putTokenRequired(
      `/repos/${owner}/${repo}/environments/${name}`,
      {
        wait_timer: waitTimer,
      },
    );
  },

  listProtectionRules: async (
    owner: string,
    repo: string,
    env: string,
  ): Promise<Response> => {
    return client.get(
      `/repos/${owner}/${repo}/environments/${env}/deployment_protection_rules`,
    );
  },

  addProtectionRule: async (
    owner: string,
    repo: string,
    env: string,
    type: string,
    value: Record<string, unknown>,
  ): Promise<Response> => {
    return client.postTokenRequired(
      `/repos/${owner}/${repo}/environments/${env}/deployment_protection_rules`,
      { type, ...value },
    );
  },

  removeProtectionRule: async (
    owner: string,
    repo: string,
    env: string,
    ruleId: number,
  ): Promise<Response> => {
    return client.deleteTokenRequired(
      `/repos/${owner}/${repo}/environments/${env}/deployment_protection_rules/${ruleId}`,
    );
  },
};

export default environments;
