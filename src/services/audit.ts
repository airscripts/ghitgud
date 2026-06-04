import logger from "@/core/logger";
import output from "@/core/output";
import { AuditEvent } from "@/types";
import { GhitgudError } from "@/core/errors";
import { ERROR_AUDIT_TARGET_REQUIRED } from "@/core/constants";
import auditApi, { AuditListOptions, AuditLogResponse } from "@/api/audit";

interface AuditOptions extends AuditListOptions {
  limit?: number | string;
}

function parseLimit(limit?: number | string): number | undefined {
  if (limit === undefined) return undefined;
  const value = Number(limit);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new GhitgudError(`Invalid limit: ${limit}.`);
  }

  return value;
}

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  return null;
}

function normalizeEvent(event: AuditLogResponse): AuditEvent {
  return {
    raw: event,
    id: event._document_id ?? "",
    action: event.action ?? "unknown",
    repo: event.repo ?? event.repository ?? null,
    actor: event.actor_login ?? event.actor ?? null,
    createdAt: normalizeTimestamp(event["@timestamp"]),
  };
}

const list = async (options: AuditOptions) => {
  if (!options.org && !options.enterprise) {
    throw new GhitgudError(ERROR_AUDIT_TARGET_REQUIRED);
  }

  logger.start("Loading audit events.");
  const limit = parseLimit(options.limit);

  const events = (await auditApi.list(options))
    .map(normalizeEvent)
    .slice(0, limit);

  output.renderTable(
    events.map((event) => ({
      action: event.action,
      repo: event.repo ?? "n/a",
      actor: event.actor ?? "n/a",
      time: event.createdAt ?? "n/a",
    })),

    { emptyMessage: "No audit events found." },
  );

  output.renderSummary("Audit Events", [["Events", events.length]]);
  logger.success("Audit events loaded.");

  return { success: true, metadata: { events } };
};

export default { list };
