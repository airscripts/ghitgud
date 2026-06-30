import billingApi from "@/api/billing";
import actionsApi from "@/api/actions";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";

const LINUX_MINUTE_COST = 0.008;

interface RunEntry {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  runStartedAt: string;
  workflowId: number;
}

interface UsageEntry {
  repo: string;
  workflow: string;
  totalMs: number;
  billableMs: number;
  estimatedCost: number;
  runs: number;
}

const usage = async (options: {
  org?: string;
  repo?: string;
  period?: string;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading Actions usage for ${repo}.`);
  const response = await actionsApi.list(repo, { status: "completed" });
  const runs =
    ((await response.json()) as { workflow_runs: RunEntry[] }).workflow_runs ??
    [];
  const workflowMap = new Map<
    string,
    { totalMs: number; billableMs: number; runs: number }
  >();
  for (const run of runs) {
    try {
      const timingResponse = await billingApi.getRunTiming(repo, run.id);
      const timing = (await timingResponse.json()) as {
        billable?: Record<string, { total_ms: number }>;
        run_duration_ms?: number;
      };
      const billable = timing.billable ?? {};
      let totalMs = 0;
      let billableMs = 0;
      for (const [, val] of Object.entries(billable)) {
        billableMs += val.total_ms;
      }
      totalMs = timing.run_duration_ms ?? 0;
      const key = run.name;
      const existing = workflowMap.get(key) ?? {
        totalMs: 0,
        billableMs: 0,
        runs: 0,
      };
      workflowMap.set(key, {
        totalMs: existing.totalMs + totalMs,
        billableMs: existing.billableMs + billableMs,
        runs: existing.runs + 1,
      });
    } catch {
      // Skip runs with missing timing.
    }
  }
  const entries: UsageEntry[] = [];
  for (const [name, data] of workflowMap) {
    entries.push({
      repo,
      workflow: name,
      totalMs: data.totalMs,
      billableMs: data.billableMs,
      estimatedCost: (data.billableMs / 60000) * LINUX_MINUTE_COST,
      runs: data.runs,
    });
  }
  output.renderTable(
    entries.map((e) => ({
      workflow: e.workflow,
      runs: e.runs,
      billableMinutes: Math.round(e.billableMs / 60000),
      estimatedCost: `$${e.estimatedCost.toFixed(2)}`,
    })),
    { emptyMessage: "No usage data found." },
  );
  logger.success(`Loaded usage for ${entries.length} workflow(s).`);
  return { success: true, entries };
};

const cost = async (options: { org?: string; repo?: string }) => {
  if (options.org) {
    logger.start(`Loading Actions cost for org ${options.org}.`);
    const response = await billingApi.getOrgUsage(options.org);
    const data = await response.json();
    output.renderKeyValues(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        key,
        String(value),
      ]),
    );
    logger.success("Cost data loaded.");
    return { success: true, data };
  }
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const usageResult = await usage({ repo });
  const totalCost = usageResult.entries.reduce(
    (sum, e) => sum + e.estimatedCost,
    0,
  );
  output.renderSummary("Actions Cost", [
    ["Repository", repo],
    ["Total estimated cost", `$${totalCost.toFixed(2)}`],
    ["Workflows", String(usageResult.entries.length)],
  ]);
  logger.success("Cost data loaded.");
  return { success: true, totalCost };
};

const topSpenders = async (options: {
  org?: string;
  repo?: string;
  limit?: number;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const limit = options.limit ?? 10;
  const usageResult = await usage({ repo });
  const sorted = usageResult.entries
    .sort((a, b) => b.estimatedCost - a.estimatedCost)
    .slice(0, limit);
  output.renderTable(
    sorted.map((e) => ({
      workflow: e.workflow,
      runs: e.runs,
      billableMinutes: Math.round(e.billableMs / 60000),
      estimatedCost: `$${e.estimatedCost.toFixed(2)}`,
    })),
    { emptyMessage: "No usage data found." },
  );
  logger.success(`Top ${sorted.length} spender(s).`);
  return { success: true, entries: sorted };
};

const exportUsage = async (options: {
  org?: string;
  repo?: string;
  format?: string;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const format = options.format ?? "json";
  const usageResult = await usage({ repo });
  if (format === "csv") {
    const header = "workflow,runs,billable_minutes,estimated_cost";
    const rows = usageResult.entries.map(
      (e) =>
        `${e.workflow},${e.runs},${Math.round(e.billableMs / 60000)},${e.estimatedCost.toFixed(2)}`,
    );
    output.log([header, ...rows].join("\n"));
  } else {
    output.writeValue(usageResult.entries);
  }
  logger.success("Usage data exported.");
  return { success: true, entries: usageResult.entries };
};

export default { usage, cost, topSpenders, exportUsage };
