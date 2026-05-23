import io from "@/core/io";
import logger from "@/core/logger";
import rulesets from "@/api/rulesets";
import { GhitgudError } from "@/core/errors";
import { ERROR_RULESET_REQUIRED } from "@/core/constants";
import { RepoTargetOptions, RulesetInput } from "@/types";

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
  logger.info("Applying repository governance.");

  if (!options.ruleset) {
    throw new GhitgudError(ERROR_RULESET_REQUIRED);
  }

  service.requireMutationConfirmation(options.dryRun, options.yes);

  const ruleset = io.readJsonFile<RulesetInput>(options.ruleset);
  if (!ruleset.name) {
    throw new GhitgudError("Ruleset name is required.");
  }

  const repos = await service.resolveTargets(options);

  return service.runBulk<GovernResult>(repos, async (repo) => {
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
};

export default { govern };
