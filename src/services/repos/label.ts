import service from "./index";
import logger from "@/core/logger";
import { RepoTargetOptions } from "@/types";
import { GhitgudError } from "@/core/errors";
import labelsService from "@/services/labels";
import { ERROR_LABEL_SOURCE_REQUIRED, TEMPLATES_DIR } from "@/core/constants";

interface LabelOptions extends RepoTargetOptions {
  yes?: boolean;
  dryRun?: boolean;
  metadata?: string;
  template?: string;
}

interface LabelResult {
  dryRun: boolean;
  created: string[];
  updated: string[];
  unchanged: string[];
}

const label = async (options: LabelOptions) => {
  logger.info("Syncing labels across repositories.");
  service.requireMutationConfirmation(options.dryRun, options.yes);

  let labels;

  if (options.template) {
    labels = labelsService.loadLabelsFromTemplate(
      options.template,
      TEMPLATES_DIR,
    );
  } else if (options.metadata) {
    labels = labelsService.loadLabelsFromMetadata(options.metadata);
  } else {
    throw new GhitgudError(ERROR_LABEL_SOURCE_REQUIRED);
  }

  const repos = await service.resolveTargets(options);

  return service.runBulk<LabelResult>(repos, async (repo) => {
    const result = await labelsService.upsertLabels(labels, repo.fullName, {
      dryRun: options.dryRun,
    });

    return {
      ...result,
      dryRun: !!options.dryRun,
    };
  });
};

export default { label };
