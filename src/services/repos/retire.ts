import service from "./index";
import api from "@/api/repos";
import logger from "@/core/logger";
import { RepoTargetOptions } from "@/types";
import { DEFAULT_REPOS_RETIRE_MONTHS } from "@/core/constants";

interface RetireOptions extends RepoTargetOptions {
  yes?: boolean;
  dryRun?: boolean;
  includeForks?: boolean;
  includePrivate?: boolean;
  months?: number | string;
}

interface RetireResult {
  action: string;
  dryRun: boolean;
  monthsInactive: number;
  lastPushedAt: string | null;
}

const retire = async (options: RetireOptions) => {
  logger.info("Evaluating repositories for retirement.");
  service.requireMutationConfirmation(options.dryRun, options.yes);

  const threshold = service.parseMonths(
    options.months,
    DEFAULT_REPOS_RETIRE_MONTHS,
  );

  const repos = await service.resolveTargets(options);

  return service.runBulk<RetireResult>(repos, async (repo) => {
    const monthsInactive = service.getInactiveMonths(repo.pushedAt);

    if (repo.archived) {
      return {
        monthsInactive,
        dryRun: !!options.dryRun,
        action: "skipped_archived",
        lastPushedAt: repo.pushedAt,
      };
    }

    if (repo.fork && !options.includeForks) {
      return {
        monthsInactive,
        action: "skipped_fork",
        dryRun: !!options.dryRun,
        lastPushedAt: repo.pushedAt,
      };
    }

    if (repo.private && !options.includePrivate) {
      return {
        monthsInactive,
        dryRun: !!options.dryRun,
        action: "skipped_private",
        lastPushedAt: repo.pushedAt,
      };
    }

    if (monthsInactive < threshold) {
      return {
        monthsInactive,
        action: "skipped_recent",
        dryRun: !!options.dryRun,
        lastPushedAt: repo.pushedAt,
      };
    }

    if (options.dryRun) {
      return {
        dryRun: true,
        monthsInactive,
        action: "would_retire",
        lastPushedAt: repo.pushedAt,
      };
    }

    await api.archive(repo.fullName);

    return {
      dryRun: false,
      monthsInactive,
      action: "retired",
      lastPushedAt: repo.pushedAt,
    };
  });
};

export default { retire };
