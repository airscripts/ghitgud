import api from "@/api/codeql";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GhitgudError } from "@/core/errors";

interface CodeQLAlert {
  number: number;
  rule: { description?: string; id?: string; severity?: string };
  tool: { name?: string };
  state: string;
  severity?: string;
  dismissedAt?: string | null;
  dismissedReason?: string | null;
  htmlUrl?: string;
  createdAt?: string;
}

const VALID_STATES = new Set(["open", "closed", "dismissed", "fixed"]);
const VALID_SEVERITIES = new Set([
  "critical",
  "high",
  "medium",
  "low",
  "warning",
  "note",
  "error",
]);
const VALID_DISMISS_REASONS = new Set([
  "false positive",
  "won't fix",
  "used in tests",
]);

const list = async (
  options: { repo?: string; state?: string; severity?: string } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  if (options.state && !VALID_STATES.has(options.state)) {
    throw new GhitgudError(
      `Invalid state "${options.state}". Valid: ${[...VALID_STATES].join(", ")}.`,
    );
  }
  if (options.severity && !VALID_SEVERITIES.has(options.severity)) {
    throw new GhitgudError(
      `Invalid severity "${options.severity}". Valid: ${[...VALID_SEVERITIES].join(", ")}.`,
    );
  }
  logger.start(`Loading CodeQL alerts for ${repo}.`);
  const response = await api.list(repo, {
    state: options.state,
    severity: options.severity,
  });
  const alerts = (await response.json()) as CodeQLAlert[];
  output.renderTable(
    alerts.map((alert) => ({
      number: alert.number,
      rule: alert.rule?.description ?? alert.rule?.id ?? "-",
      severity: alert.severity ?? alert.rule?.severity ?? "-",
      state: alert.state,
      tool: alert.tool?.name ?? "-",
      created: alert.createdAt ?? "-",
    })),
    { emptyMessage: "No CodeQL alerts found." },
  );
  logger.success(`Loaded ${alerts.length} alert(s).`);
  return { success: true, alerts };
};

const view = async (options: { repo?: string; alertNumber: number }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading CodeQL alert ${options.alertNumber}.`);
  const response = await api.get(repo, options.alertNumber);
  const alert = (await response.json()) as CodeQLAlert &
    Record<string, unknown>;
  output.renderKeyValues([
    ["Number", alert.number],
    ["Rule", alert.rule?.description ?? alert.rule?.id ?? "-"],
    ["Severity", alert.severity ?? alert.rule?.severity ?? "-"],
    ["State", alert.state],
    ["Tool", alert.tool?.name ?? "-"],
    ["Dismissed", alert.dismissedReason ?? "-"],
    ["Created", alert.createdAt ?? "-"],
    ["URL", alert.htmlUrl ?? "-"],
  ]);
  logger.success(`Loaded alert ${options.alertNumber}.`);
  return { success: true, alert };
};

const dismiss = async (options: {
  repo?: string;
  alertNumber: number;
  reason: string;
  comment?: string;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  if (!VALID_DISMISS_REASONS.has(options.reason)) {
    throw new GhitgudError(
      `Invalid dismiss reason "${options.reason}". Valid: ${[...VALID_DISMISS_REASONS].join(", ")}.`,
    );
  }
  logger.start(`Dismissing CodeQL alert ${options.alertNumber}.`);
  const response = await api.update(repo, options.alertNumber, {
    state: "dismissed",
    dismissed_reason: options.reason,
    dismissed_comment: options.comment,
  });
  const alert = (await response.json()) as CodeQLAlert;
  logger.success(`Dismissed alert ${options.alertNumber}.`);
  return { success: true, alert };
};

export default { list, view, dismiss };
