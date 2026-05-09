import client from "./client";
import { Label } from "@/types";

const labels = {
  fetch: async (): Promise<Response> => {
    const repo = client.getRepo();
    return client.get(`/repos/${repo}/labels`);
  },

  get: async (name: string): Promise<Response> => {
    const repo = client.getRepo();
    return client.get(`/repos/${repo}/labels/${name}`);
  },

  create: async (label: Label): Promise<Response> => {
    const repo = client.getRepo();

    return client.post(`/repos/${repo}/labels`, {
      name: label.name,
      color: label.color,
      description: label.description,
    });
  },

  patch: async (label: Label): Promise<Response> => {
    const repo = client.getRepo();

    return client.patch(`/repos/${repo}/labels/${label.name}`, {
      color: label.color,
      description: label.description,
      new_name: label.newName || label.name,
    });
  },

  delete: async (name: string): Promise<Response> => {
    const repo = client.getRepo();
    return client.delete(`/repos/${repo}/labels/${name}`);
  },
};

export default labels;
