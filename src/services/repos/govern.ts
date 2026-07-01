import logger from "@/core/logger";
import rulesets from "@/api/rulesets";
import { readDefinition } from "@/services/ruleset";
import { GitfleetError } from "@/core/errors";
import { ERROR_RULESET_REQUIRED } from "@/core/constants";
import { RepoTargetOptions } from "@/types";

import service from "./index";

interface GovernOptions extends RepoTargetOptions {
  yes?: boolean;
  dryRun?: boolean;
  ruleset?: string;
}

interface GovernResult {
  action: string;
  ruleset: string;
  dryRun: boolean;
}

const govern = async (options: GovernOptions) => {
  logger.start(
    options.dryRun
      ? "Previewing repository governance changes."
      : "Applying repository governance changes.",
  );

  if (!options.ruleset) {
    throw new GitfleetError(ERROR_RULESET_REQUIRED);
  }

  service.requireMutationConfirmation(options.dryRun, options.yes);

  const ruleset = readDefinition(options.ruleset);

  const repos = await service.resolveTargets(options);

  const result = await service.runBulk<GovernResult>(repos, async (repo) => {
    const existing = await rulesets.list(repo.fullName);
    const match = existing.find((item) => item.name === ruleset.name);

    if (options.dryRun) {
      return {
        ruleset: ruleset.name,
        action: match ? "would_update" : "would_create",
        dryRun: true,
      };
    }

    if (match) {
      await rulesets.update(repo.fullName, match.id, ruleset);
      return {
        ruleset: ruleset.name,
        action: "updated",
        dryRun: false,
      };
    }

    await rulesets.create(repo.fullName, ruleset);
    return {
      ruleset: ruleset.name,
      action: "created",
      dryRun: false,
    };
  });

  service.renderBulkResults(
    "Governance Summary",
    result,
    (_repo, metadata) => ({
      ruleset: metadata.ruleset,
      action: metadata.action,
      mode: metadata.dryRun ? "dry-run" : "apply",
    }),
  );

  return result;
};

export default { govern };
