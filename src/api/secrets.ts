import client from "./client";

import { SecretVisibility } from "@/types";

const secrets = {
  listRepo: async (owner: string, repo: string): Promise<Response> => {
    return client.get(
      `/repos/${owner}/${repo}/actions/secrets?per_page=${client.getDefaultPerPage()}`,
    );
  },

  listOrg: async (org: string): Promise<Response> => {
    return client.get(
      `/orgs/${org}/actions/secrets?per_page=${client.getDefaultPerPage()}`,
    );
  },

  listEnv: async (
    owner: string,
    repo: string,
    env: string,
  ): Promise<Response> => {
    return client.get(
      `/repos/${owner}/${repo}/environments/${env}/secrets?per_page=${client.getDefaultPerPage()}`,
    );
  },

  getRepoPublicKey: async (owner: string, repo: string): Promise<Response> => {
    return client.getTokenRequired(
      `/repos/${owner}/${repo}/actions/secrets/public-key`,
    );
  },

  getOrgPublicKey: async (org: string): Promise<Response> => {
    return client.getTokenRequired(`/orgs/${org}/actions/secrets/public-key`);
  },

  getEnvPublicKey: async (
    owner: string,
    repo: string,
    env: string,
  ): Promise<Response> => {
    return client.getTokenRequired(
      `/repos/${owner}/${repo}/environments/${env}/secrets/public-key`,
    );
  },

  setRepo: async (
    owner: string,
    repo: string,
    name: string,
    encryptedValue: string,
    keyId: string,
  ): Promise<Response> => {
    return client.putTokenRequired(
      `/repos/${owner}/${repo}/actions/secrets/${name}`,
      { encrypted_value: encryptedValue, key_id: keyId },
    );
  },

  setOrg: async (
    org: string,
    name: string,
    encryptedValue: string,
    keyId: string,
    visibility: SecretVisibility,
    selectedRepositories?: number[],
  ): Promise<Response> => {
    const body: Record<string, unknown> = {
      visibility,
      key_id: keyId,
      encrypted_value: encryptedValue,
    };

    if (visibility === "selected" && selectedRepositories) {
      body.selected_repository_ids = selectedRepositories;
    }

    return client.putTokenRequired(
      `/orgs/${org}/actions/secrets/${name}`,
      body,
    );
  },

  setEnv: async (
    owner: string,
    repo: string,
    env: string,
    name: string,
    encryptedValue: string,
    keyId: string,
  ): Promise<Response> => {
    return client.putTokenRequired(
      `/repos/${owner}/${repo}/environments/${env}/secrets/${name}`,
      { encrypted_value: encryptedValue, key_id: keyId },
    );
  },

  deleteRepo: async (
    owner: string,
    repo: string,
    name: string,
  ): Promise<Response> => {
    return client.deleteTokenRequired(
      `/repos/${owner}/${repo}/actions/secrets/${name}`,
    );
  },

  deleteOrg: async (org: string, name: string): Promise<Response> => {
    return client.deleteTokenRequired(`/orgs/${org}/actions/secrets/${name}`);
  },

  deleteEnv: async (
    owner: string,
    repo: string,
    env: string,
    name: string,
  ): Promise<Response> => {
    return client.deleteTokenRequired(
      `/repos/${owner}/${repo}/environments/${env}/secrets/${name}`,
    );
  },
};

export default secrets;
