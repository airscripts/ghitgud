import client from "./client";
import { repoPath } from "./path";

export interface GitHubRelease {
  id: number;
  draft: boolean;
  tag_name: string;
  html_url: string;
  name: string | null;
  body: string | null;

  assets: Array<{
    id: number;
    name: string;
    size: number;
    content_type: string;
  }>;
}

export interface CreateReleaseBody {
  name?: string;
  body?: string;
  draft: boolean;
  tag_name: string;
  generate_release_notes?: boolean;
}

const releases = {
  fetchByTag: async (repo: string, tag: string): Promise<GitHubRelease> => {
    const response = await client.get(repoPath(repo, "releases", "tags", tag));

    return (await response.json()) as GitHubRelease;
  },

  create: async (
    repo: string,
    body: CreateReleaseBody,
  ): Promise<GitHubRelease> => {
    const response = await client.post(repoPath(repo, "releases"), body);
    return (await response.json()) as GitHubRelease;
  },
};

export default releases;
