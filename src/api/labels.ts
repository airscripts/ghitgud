import client from "./client";
import { Label } from "@/types";
import { repoPath } from "./path";

const labels = {
  fetch: async (repo = client.getRepo()): Promise<Response> => {
    return client.get(repoPath(repo, "labels"));
  },

  get: async (name: string, repo = client.getRepo()): Promise<Response> => {
    return client.get(repoPath(repo, "labels", name));
  },

  create: async (label: Label, repo = client.getRepo()): Promise<Response> => {
    return client.post(repoPath(repo, "labels"), {
      name: label.name,
      color: label.color,
      description: label.description,
    });
  },

  patch: async (label: Label, repo = client.getRepo()): Promise<Response> => {
    return client.patch(repoPath(repo, "labels", label.name), {
      color: label.color,
      description: label.description,
      new_name: label.newName || label.name,
    });
  },

  delete: async (name: string, repo = client.getRepo()): Promise<Response> => {
    return client.delete(repoPath(repo, "labels", name));
  },
};

export default labels;
