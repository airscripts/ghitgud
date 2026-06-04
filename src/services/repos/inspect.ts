import service from "./index";
import logger from "@/core/logger";
import contents from "@/api/contents";
import { RepoInspectResult, RepoTargetOptions } from "@/types";

import {
  README_LABEL,
  LICENSE_LABEL,
  SECURITY_LABEL,
  CODEOWNERS_LABEL,
  CODEOWNERS_PATHS,
  GOVERNANCE_CHECK_COUNT,
} from "@/core/constants";

function hasReadme(entries: { name: string }[]): boolean {
  return entries.some((entry) => /^README(\..+)?$/i.test(entry.name));
}

const inspectRepo = async (repo: string): Promise<RepoInspectResult> => {
  const rootEntries = await contents.list(repo);
  const rootNames = new Set(rootEntries.map((entry) => entry.name));
  const present: string[] = [];
  const missing: string[] = [];

  if (hasReadme(rootEntries)) {
    present.push(README_LABEL);
  } else {
    missing.push(README_LABEL);
  }

  if (rootNames.has(LICENSE_LABEL)) {
    present.push(LICENSE_LABEL);
  } else {
    missing.push(LICENSE_LABEL);
  }

  if (await contents.exists(repo, SECURITY_LABEL)) {
    present.push(SECURITY_LABEL);
  } else {
    missing.push(SECURITY_LABEL);
  }

  if (await contents.existsAny(repo, CODEOWNERS_PATHS)) {
    present.push(CODEOWNERS_LABEL);
  } else {
    missing.push(CODEOWNERS_LABEL);
  }

  return {
    present,
    missing,
    score: Math.round((present.length / GOVERNANCE_CHECK_COUNT) * 100),
  };
};

const inspect = async (options: RepoTargetOptions = {}) => {
  logger.start("Inspecting repository governance files.");
  const repos = await service.resolveTargets(options);

  const result = await service.runBulk<RepoInspectResult>(repos, async (repo) =>
    inspectRepo(repo.fullName),
  );

  service.renderBulkResults(
    "Inspection Summary",
    result,

    (_repo, metadata) => ({
      score: `${metadata.score}%`,
      present: metadata.present.join(", ") || "none",
      missing: metadata.missing.join(", ") || "none",
    }),
  );

  return result;
};

export default { inspect, inspectRepo };
