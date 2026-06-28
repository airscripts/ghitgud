type PagesBuildType = "legacy" | "workflow";

interface PagesSource {
  branch: string;
  path: "/" | "/docs";
}

interface PagesSite {
  url: string;
  status: string;
  htmlUrl: string;
  source?: PagesSource;
  httpsEnforced: boolean;
  buildType: PagesBuildType;
}

interface PagesBuild {
  url: string;
  status: string;
  error?: string;
  commit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type { PagesBuild, PagesBuildType, PagesSite, PagesSource };
