import output from "@/core/output";
import logger from "@/core/logger";
import pagesApi from "@/api/pages";
import { GhitgudError, NotFoundError } from "@/core/errors";

import type {
  PagesSite,
  PagesBuild,
  PagesSource,
  PagesBuildType,
} from "@/types";

type PagesPath = PagesSource["path"];

const VALID_BUILD_TYPES: PagesBuildType[] = ["legacy", "workflow"];

function validateSource(
  source: string,
  path: string,
  buildType?: string,
): PagesSource & { buildType: PagesBuildType } {
  if (!source.trim()) {
    throw new GhitgudError("Pages source branch is required.");
  }

  if (path !== "/" && path !== "/docs") {
    throw new GhitgudError('Pages path must be "/" or "/docs".');
  }

  const resolved = buildType ?? "legacy";
  if (!VALID_BUILD_TYPES.includes(resolved as PagesBuildType)) {
    throw new GhitgudError(`Pages build type must be "legacy" or "workflow".`);
  }

  return {
    branch: source.trim(),
    path: path as PagesPath,
    buildType: resolved as PagesBuildType,
  };
}

async function getSite(repo: string): Promise<PagesSite | null> {
  try {
    return await pagesApi.get(repo);
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

const status = async (
  repo: string,
): Promise<{
  success: boolean;
  configured: boolean;
  site: PagesSite | null;
  build: PagesBuild | null;
}> => {
  logger.start(`Loading GitHub Pages status for ${repo}.`);
  const site = await getSite(repo);

  if (!site) {
    output.log("GitHub Pages is not configured for this repository.");
    logger.success("GitHub Pages status loaded.");
    return { success: true, configured: false, site: null, build: null };
  }

  let build: PagesBuild | null = null;
  try {
    build = await pagesApi.getLatestBuild(repo);
  } catch (error) {
    if (!(error instanceof NotFoundError)) throw error;
  }

  output.renderSummary("GitHub Pages", [
    ["URL", site.htmlUrl],
    ["Status", site.status],
    ["Build type", site.buildType],
    ["Source", site.source?.branch ?? "-"],
    ["Path", site.source?.path ?? "-"],
    ["HTTPS", site.httpsEnforced ? "enforced" : "not enforced"],
    ["Latest build", build?.status ?? "none"],
    ["Commit", build?.commit ?? "-"],
    ["Updated", build?.updatedAt ?? "-"],
  ]);

  logger.success("GitHub Pages status loaded.");
  return { success: true, configured: true, site, build };
};

const deploy = async (
  repo: string,
  options: { source: string; path?: string; buildType?: string },
): Promise<{
  success: boolean;
  created: boolean;
  source: PagesSource;
  build: PagesBuild;
}> => {
  const validated = validateSource(
    options.source,
    options.path ?? "/",
    options.buildType,
  );
  const { buildType, ...source } = validated;
  logger.start(`Configuring GitHub Pages for ${repo}.`);
  const existing = await getSite(repo);

  if (existing) {
    await pagesApi.update(repo, source, buildType);
  } else {
    await pagesApi.create(repo, source, buildType);
  }

  const build = await pagesApi.requestBuild(repo);
  logger.success(
    `GitHub Pages ${existing ? "updated" : "configured"}; build ${build.status}.`,
  );

  return { success: true, created: !existing, source, build };
};

const unpublish = async (repo: string): Promise<{ success: boolean }> => {
  logger.start(`Unpublishing GitHub Pages for ${repo}.`);

  try {
    await pagesApi.remove(repo);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new GhitgudError(
        "GitHub Pages is not configured for this repository.",
      );
    }

    throw error;
  }

  logger.success(`Unpublished GitHub Pages for ${repo}.`);
  return { success: true };
};

export default { deploy, status, unpublish };
