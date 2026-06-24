import output from "@/core/output";
import logger from "@/core/logger";
import repoService from "@/services/repos";
import { GhitgudError } from "@/core/errors";
import { DependabotAlert, RepoTargetOptions } from "@/types";
import dependabotApi, { DependabotListOptions } from "@/api/dependabot";

import {
  ERROR_NO_REPO,
  DEPENDABOT_DISMISS_REASONS,
  ERROR_MUTATION_REQUIRES_YES,
  ERROR_DEPENDABOT_ALERT_REQUIRED,
  ERROR_INVALID_DEPENDABOT_DISMISS_REASON,
  ERROR_DEPENDABOT_DISMISS_REASON_REQUIRED,
} from "@/core/constants";

interface ListOptions extends RepoTargetOptions, DependabotListOptions {}

interface DismissOptions {
  repo?: string;
  yes?: boolean;
  reason?: string;
  comment?: string;
}

function normalizeAlert(
  repo: string,
  alert: {
    number: number;
    state: string;

    dependency?: {
      package?: {
        name?: string;
        ecosystem?: string;
      };

      manifest_path?: string;
    };

    security_advisory?: {
      summary?: string;
      severity?: string;
    };

    dismissed_reason?: string | null;
  },
): DependabotAlert {
  return {
    repository: repo,
    state: alert.state,
    number: alert.number,
    dismissedReason: alert.dismissed_reason ?? null,
    advisory: alert.security_advisory?.summary ?? "unknown",
    severity: alert.security_advisory?.severity ?? "unknown",
    packageName: alert.dependency?.package?.name ?? "unknown",
    manifestPath: alert.dependency?.manifest_path ?? "unknown",
    ecosystem: alert.dependency?.package?.ecosystem ?? "unknown",
  };
}

const list = async (options: ListOptions = {}) => {
  logger.start("Loading Dependabot alerts.");
  const repos = await repoService.resolveTargets(options);

  const result = await repoService.runBulk<{ alerts: DependabotAlert[] }>(
    repos,
    async (repo) => {
      const alerts = await dependabotApi.listAlerts(repo.fullName, options);

      return {
        alerts: alerts.map((alert) => normalizeAlert(repo.fullName, alert)),
      };
    },
  );

  repoService.renderBulkResults("Dependabot Alerts", result, (_repo, data) => ({
    alerts: data.alerts.length,

    critical: data.alerts.filter((alert) => alert.severity === "critical")
      .length,

    high: data.alerts.filter((alert) => alert.severity === "high").length,
  }));

  return result;
};

const dismiss = async (alertNumber: number, options: DismissOptions) => {
  if (!alertNumber) {
    throw new GhitgudError(ERROR_DEPENDABOT_ALERT_REQUIRED);
  }

  if (!options.repo) {
    throw new GhitgudError(ERROR_NO_REPO);
  }

  if (!options.reason) {
    throw new GhitgudError(ERROR_DEPENDABOT_DISMISS_REASON_REQUIRED);
  }

  if (!DEPENDABOT_DISMISS_REASONS.includes(options.reason as never)) {
    throw new GhitgudError(ERROR_INVALID_DEPENDABOT_DISMISS_REASON);
  }

  if (!options.yes) {
    throw new GhitgudError(ERROR_MUTATION_REQUIRES_YES);
  }

  const repo = options.repo;
  logger.start(`Dismissing Dependabot alert ${alertNumber}.`);

  await dependabotApi.dismissAlert(repo, alertNumber, {
    reason: options.reason,
    comment: options.comment,
  });

  const metadata = {
    repo,
    dismissed: true,
    alert: alertNumber,
    reason: options.reason,
  };

  output.renderSummary("Dependabot Alert Dismissed", [
    ["Repository", repo],
    ["Alert", alertNumber],
    ["Reason", options.reason],
  ]);

  logger.success("Dependabot alert dismissed.");
  return { success: true, metadata };
};

export default { list, dismiss };
