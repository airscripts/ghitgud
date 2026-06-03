import client from "./client";
import { NotFoundError } from "@/core/errors";

interface ContentEntry {
  name: string;
  path: string;
  type: string;
}

function contentPath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

const contents = {
  list: async (repo: string, path = ""): Promise<ContentEntry[]> => {
    const endpoint = path
      ? `/repos/${repo}/contents/${contentPath(path)}`
      : `/repos/${repo}/contents`;

    const response = await client.get(endpoint);
    const data = (await response.json()) as ContentEntry | ContentEntry[];

    return Array.isArray(data) ? data : [data];
  },

  exists: async (repo: string, path: string): Promise<boolean> => {
    try {
      await client.get(`/repos/${repo}/contents/${contentPath(path)}`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }

      throw error;
    }
  },

  existsAny: async (
    repo: string,
    paths: readonly string[],
  ): Promise<boolean> => {
    for (const path of paths) {
      if (await contents.exists(repo, path)) return true;
    }

    return false;
  },
};

export default contents;
