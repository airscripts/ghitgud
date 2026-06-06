import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

import git from "@/core/git";
import output from "@/core/output";
import logger from "@/core/logger";
import repoService from "@/services/repos";
import { GhitgudError } from "@/core/errors";
import leaksApi, { LeakAlertsOptions } from "@/api/leaks";

import {
  RepoTargetOptions,
  SecretScanFinding,
  SecretScanningAlert,
} from "@/types";

interface ScanOptions {
  limit?: number | string;
}

interface AlertOptions extends RepoTargetOptions, LeakAlertsOptions {}

interface SecretRule {
  id: string;
  pattern: RegExp;
  confidence: SecretScanFinding["confidence"];
}

const SECRET_RULES: SecretRule[] = [
  {
    id: "github-token",
    confidence: "high",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  },

  {
    confidence: "high",
    id: "classic-github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  },

  {
    confidence: "high",
    id: "aws-access-key",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
  },

  {
    id: "private-key",
    confidence: "high",
    pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },

  {
    confidence: "medium",
    id: "generic-api-key",
    pattern: /\b(?:api[_-]?key|token|secret)\s*[:=]\s*["'][^"']{16,}["']/gi,
  },

  {
    confidence: "low",
    id: "high-entropy-assignment",

    pattern:
      /\b[A-Z0-9_]*(?:TOKEN|SECRET|KEY)[A-Z0-9_]*\s*=\s*[A-Za-z0-9+/=_-]{32,}/g,
  },
];

function parseLimit(limit?: number | string): number {
  if (limit === undefined) return 100;
  const value = Number(limit);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new GhitgudError(`Invalid limit: ${limit}.`);
  }

  return value;
}

function redact(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "[redacted]";
  return `${trimmed.slice(0, 4)}...[redacted]...${trimmed.slice(-4)}`;
}

function collectFindings(
  file: string,
  content: string,
  limit: number,
): SecretScanFinding[] {
  const findings: SecretScanFinding[] = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    if (findings.length >= limit) return;

    for (const rule of SECRET_RULES) {
      const matches = line.matchAll(rule.pattern);

      for (const match of matches) {
        findings.push({
          file,
          rule: rule.id,
          line: index + 1,
          match: redact(match[0]),
          confidence: rule.confidence,
        });

        if (findings.length >= limit) return;
      }
    }
  });

  return findings;
}

function listTrackedFiles(repoRoot: string): string[] {
  const outputValue = execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return outputValue.trim().split("\n").filter(Boolean);
}

function readRecentHistory(repoRoot: string): string {
  try {
    return execFileSync(
      "git",
      ["log", "--all", "--max-count=200", "--patch", "--no-ext-diff"],

      {
        cwd: repoRoot,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      },
    );
  } catch {
    return "";
  }
}

function isReadableTextFile(filePath: string): boolean {
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size > 1024 * 1024) return false;

  const sample = fs.readFileSync(filePath);
  return !sample.includes(0);
}

const scan = async (options: ScanOptions = {}) => {
  logger.start("Scanning repository for likely secrets.");
  const repoRoot = git.getRepoRoot();
  const limit = parseLimit(options.limit);
  const findings: SecretScanFinding[] = [];

  for (const file of listTrackedFiles(repoRoot)) {
    if (findings.length >= limit) break;

    const absolutePath = path.join(repoRoot, file);
    if (!fs.existsSync(absolutePath) || !isReadableTextFile(absolutePath)) {
      continue;
    }

    const content = fs.readFileSync(absolutePath, "utf8");
    findings.push(...collectFindings(file, content, limit - findings.length));
  }

  if (findings.length < limit) {
    findings.push(
      ...collectFindings(
        "git-history",
        readRecentHistory(repoRoot),
        limit - findings.length,
      ),
    );
  }

  output.renderTable(
    findings.map((finding) => ({
      file: finding.file,
      rule: finding.rule,
      match: finding.match,
      line: finding.line ?? "-",
      confidence: finding.confidence,
    })),

    { emptyMessage: "No likely secrets found." },
  );

  output.renderSummary("Secret Scan", [["Findings", findings.length]]);
  logger.success("Secret scan completed.");
  return { success: true, metadata: { findings } };
};

function normalizeAlert(
  repo: string,
  alert: {
    state: string;
    number: number;
    html_url?: string;
    created_at: string;
    secret_type: string;
    resolution: string | null;
    resolved_at: string | null;
    secret_type_display_name: string;
  },
): SecretScanningAlert {
  return {
    repository: repo,
    state: alert.state,
    number: alert.number,
    url: alert.html_url ?? "",
    createdAt: alert.created_at,
    resolution: alert.resolution,
    secretType: alert.secret_type,
    resolvedAt: alert.resolved_at,
    secretTypeDisplayName: alert.secret_type_display_name,
  };
}

const alerts = async (options: AlertOptions = {}) => {
  logger.start("Loading secret scanning alerts.");
  const repos = await repoService.resolveTargets(options);

  const result = await repoService.runBulk<{
    alerts: SecretScanningAlert[];
  }>(repos, async (repo) => {
    const alertsResult = await leaksApi.listAlerts(repo.fullName, options);

    return {
      alerts: alertsResult.map((alert) => normalizeAlert(repo.fullName, alert)),
    };
  });

  repoService.renderBulkResults(
    "Secret Scanning Alerts",
    result,
    (_repo, metadata) => ({
      alerts: metadata.alerts.length,
      open: metadata.alerts.filter((alert) => alert.state === "open").length,
    }),
  );

  return result;
};

export default { scan, alerts };
