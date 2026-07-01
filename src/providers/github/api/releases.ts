import client from "@/providers/github/client";
import { repoPath } from "./path";

export interface GitHubRelease {
  id: number;
  draft: boolean;
  tag_name: string;
  html_url: string;
  name: string | null;
  body: string | null;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  upload_url: string;

  assets: Array<{
    id: number;
    name: string;
    size: number;
    content_type: string;
    browser_download_url: string;
  }>;
}

export interface CreateReleaseBody {
  name?: string;
  body?: string;
  draft: boolean;
  tag_name: string;
  generate_release_notes?: boolean;
  make_latest?: boolean | "legacy";
  prerelease?: boolean;
}

export interface UpdateReleaseBody {
  name?: string;
  body?: string;
}

const releases = {
  list: async (repo: string, limit: number): Promise<GitHubRelease[]> => {
    const query = new URLSearchParams({ per_page: String(limit) });
    const response = await client.getTokenRequired(
      `${repoPath(repo, "releases")}?${query}`,
    );
    return (await response.json()) as GitHubRelease[];
  },
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

  update: async (
    repo: string,
    releaseId: number,
    body: UpdateReleaseBody,
  ): Promise<GitHubRelease> => {
    const response = await client.patchTokenRequired(
      repoPath(repo, "releases", releaseId),
      body,
    );
    return (await response.json()) as GitHubRelease;
  },

  delete: (repo: string, releaseId: number): Promise<Response> =>
    client.deleteTokenRequired(repoPath(repo, "releases", releaseId)),

  deleteAsset: (repo: string, assetId: number): Promise<Response> =>
    client.deleteTokenRequired(repoPath(repo, "releases", "assets", assetId)),

  downloadAsset: (url: string): Promise<Response> =>
    client.getUrlTokenRequiredWithAccept(url, "application/octet-stream"),

  uploadAsset: async (
    uploadUrl: string,
    name: string,
    contentType: string,
    body: BodyInit,
  ) => {
    const url = `${uploadUrl.replace(/\{.*$/, "")}?${new URLSearchParams({ name })}`;
    const response = await client.postRawUrlTokenRequired(
      url,
      body,
      contentType,
    );
    return response.json();
  },
};

export default releases;
