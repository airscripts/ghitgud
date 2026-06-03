import client from "./client";
import { Label } from "@/types";

function labelPath(name: string): string {
  return encodeURIComponent(name);
}

const labels = {
  fetch: async (repo = client.getRepo()): Promise<Response> => {
    return client.get(`/repos/${repo}/labels`);
  },

  get: async (name: string, repo = client.getRepo()): Promise<Response> => {
    return client.get(`/repos/${repo}/labels/${labelPath(name)}`);
  },

  create: async (label: Label, repo = client.getRepo()): Promise<Response> => {
    return client.post(`/repos/${repo}/labels`, {
      name: label.name,
      color: label.color,
      description: label.description,
    });
  },

  patch: async (label: Label, repo = client.getRepo()): Promise<Response> => {
    return client.patch(`/repos/${repo}/labels/${labelPath(label.name)}`, {
      color: label.color,
      description: label.description,
      new_name: label.newName || label.name,
    });
  },

  delete: async (name: string, repo = client.getRepo()): Promise<Response> => {
    return client.delete(`/repos/${repo}/labels/${labelPath(name)}`);
  },
};

export default labels;
