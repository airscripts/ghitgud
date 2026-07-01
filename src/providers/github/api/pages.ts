import client from "@/providers/github/client";

import type {
  PagesSite,
  PagesBuild,
  PagesSource,
  PagesBuildType,
} from "@/types";

interface GitHubPagesSite {
  url: string;
  status: string;
  html_url: string;
  source?: PagesSource;
  https_enforced: boolean;
  build_type: PagesBuildType;
}

interface GitHubPagesBuild {
  url: string;
  status: string;
  commit?: string;
  created_at?: string;
  updated_at?: string;
  error?: { message?: string } | string;
}

const normalizeSite = (site: GitHubPagesSite): PagesSite => ({
  url: site.url,
  status: site.status,
  source: site.source,
  htmlUrl: site.html_url,
  buildType: site.build_type,
  httpsEnforced: site.https_enforced,
});

const normalizeBuild = (build: GitHubPagesBuild): PagesBuild => ({
  url: build.url,
  status: build.status,
  commit: build.commit,
  createdAt: build.created_at,
  updatedAt: build.updated_at,
  error: typeof build.error === "string" ? build.error : build.error?.message,
});

const pages = {
  get: async (repo: string): Promise<PagesSite> => {
    const response = await client.get(`/repos/${repo}/pages`);
    return normalizeSite((await response.json()) as GitHubPagesSite);
  },

  getLatestBuild: async (repo: string): Promise<PagesBuild> => {
    const response = await client.get(`/repos/${repo}/pages/builds/latest`);
    return normalizeBuild((await response.json()) as GitHubPagesBuild);
  },

  create: async (
    repo: string,
    source: PagesSource,
    buildType: PagesBuildType = "legacy",
  ): Promise<PagesSite> => {
    const response = await client.postTokenRequired(`/repos/${repo}/pages`, {
      build_type: buildType,
      source,
    });

    return normalizeSite((await response.json()) as GitHubPagesSite);
  },

  update: async (
    repo: string,
    source: PagesSource,
    buildType: PagesBuildType = "legacy",
  ): Promise<void> => {
    await client.putTokenRequired(`/repos/${repo}/pages`, {
      build_type: buildType,
      source,
    });
  },

  requestBuild: async (repo: string): Promise<PagesBuild> => {
    const response = await client.postTokenRequired(
      `/repos/${repo}/pages/builds`,
      {},
    );

    return normalizeBuild((await response.json()) as GitHubPagesBuild);
  },

  remove: async (repo: string): Promise<void> => {
    await client.deleteTokenRequired(`/repos/${repo}/pages`);
  },
};

export default pages;
