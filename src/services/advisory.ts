import api from "@/api/advisories";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GitfleetError } from "@/core/errors";

interface AdvisoryEntry {
  ghsaId: string;
  summary?: string;
  severity?: string;
  ecosystem?: string;
  cve_id?: string | null;
  published_at?: string;
  html_url?: string;
  state?: string;
}

const VALID_STATES = new Set(["published", "draft", "triage", "closed"]);
const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

const list = async (
  options: {
    ecosystem?: string;
    severity?: string;
    state?: string;
    repo?: string;
  } = {},
) => {
  if (options.state && !VALID_STATES.has(options.state)) {
    throw new GitfleetError(
      `Invalid state "${options.state}". Valid: ${[...VALID_STATES].join(", ")}.`,
    );
  }
  if (options.severity && !VALID_SEVERITIES.has(options.severity)) {
    throw new GitfleetError(
      `Invalid severity "${options.severity}". Valid: ${[...VALID_SEVERITIES].join(", ")}.`,
    );
  }
  if (options.repo) {
    const repo = options.repo;
    logger.start(`Loading advisories for ${repo}.`);
    const response = await api.listRepo(repo, {
      state: options.state,
      severity: options.severity,
      ecosystem: options.ecosystem,
    });
    const advisories = (await response.json()) as AdvisoryEntry[];
    output.renderTable(
      advisories.map((adv) => ({
        id: adv.ghsaId,
        state: adv.state ?? "-",
        severity: adv.severity ?? "-",
        ecosystem: adv.ecosystem ?? "-",
        summary: (adv.summary ?? "-").slice(0, 80),
        cve: adv.cve_id ?? "-",
        published: adv.published_at ?? "-",
      })),
      { emptyMessage: "No advisories found." },
    );
    logger.success(`Loaded ${advisories.length} advisories.`);
    return { success: true, advisories };
  }
  logger.start("Loading advisories.");
  const response = await api.list({
    ecosystem: options.ecosystem,
    severity: options.severity,
    perPage: 30,
  });
  const advisories = (await response.json()) as AdvisoryEntry[];
  output.renderTable(
    advisories.map((adv) => ({
      id: adv.ghsaId,
      severity: adv.severity ?? "-",
      ecosystem: adv.ecosystem ?? "-",
      summary: (adv.summary ?? "-").slice(0, 80),
      cve: adv.cve_id ?? "-",
      published: adv.published_at ?? "-",
    })),
    { emptyMessage: "No advisories found." },
  );
  logger.success(`Loaded ${advisories.length} advisories.`);
  return { success: true, advisories };
};

const view = async (ghsaId: string, options: { repo?: string } = {}) => {
  if (options.repo) {
    const repo = options.repo;
    logger.start(`Loading advisory ${ghsaId} for ${repo}.`);
    const response = await api.getRepo(repo, ghsaId);
    const adv = (await response.json()) as AdvisoryEntry &
      Record<string, unknown>;
    output.renderKeyValues([
      ["ID", adv.ghsaId],
      ["Summary", (adv.summary as string) ?? "-"],
      ["Severity", (adv.severity as string) ?? "-"],
      ["State", adv.state ?? "-"],
      ["CVE", adv.cve_id ?? "-"],
      ["Ecosystem", (adv.ecosystem as string) ?? "-"],
      ["Published", adv.published_at ?? "-"],
      ["URL", adv.html_url ?? "-"],
    ]);
    logger.success(`Loaded advisory ${ghsaId}.`);
    return { success: true, advisory: adv };
  }
  logger.start(`Loading advisory ${ghsaId}.`);
  const response = await api.get(ghsaId);
  const adv = (await response.json()) as AdvisoryEntry &
    Record<string, unknown>;
  output.renderKeyValues([
    ["ID", adv.ghsaId],
    ["Summary", (adv.summary as string) ?? "-"],
    ["Severity", (adv.severity as string) ?? "-"],
    ["CVE", adv.cve_id ?? "-"],
    ["Ecosystem", (adv.ecosystem as string) ?? "-"],
    ["Published", adv.published_at ?? "-"],
    ["URL", adv.html_url ?? "-"],
  ]);
  logger.success(`Loaded advisory ${ghsaId}.`);
  return { success: true, advisory: adv };
};

const create = async (options: {
  repo?: string;
  summary: string;
  description: string;
  severity: string;
  cveId?: string;
  vulnerableVersionRange?: string;
  patchedVersionRange?: string;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  if (!VALID_SEVERITIES.has(options.severity)) {
    throw new GitfleetError(
      `Invalid severity "${options.severity}". Valid: ${[...VALID_SEVERITIES].join(", ")}.`,
    );
  }
  logger.start(`Creating security advisory for ${repo}.`);
  const response = await api.create(repo, {
    summary: options.summary,
    description: options.description,
    severity: options.severity,
    cveId: options.cveId,
    vulnerableVersionRange: options.vulnerableVersionRange,
    patchedVersionRange: options.patchedVersionRange,
  });
  const adv = (await response.json()) as AdvisoryEntry &
    Record<string, unknown>;
  output.renderKeyValues([
    ["ID", adv.ghsaId ?? "-"],
    ["Summary", (adv.summary as string) ?? "-"],
    ["Severity", (adv.severity as string) ?? "-"],
    ["State", adv.state ?? "draft"],
  ]);
  logger.success(`Created advisory ${adv.ghsaId ?? ""}.`);
  return { success: true, advisory: adv };
};

const publish = async (ghsaId: string, options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Publishing advisory ${ghsaId}.`);
  const response = await api.update(repo, ghsaId, { state: "published" });
  const adv = (await response.json()) as AdvisoryEntry;
  logger.success(`Published advisory ${ghsaId}.`);
  return { success: true, advisory: adv };
};

const close = async (ghsaId: string, options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Closing advisory ${ghsaId}.`);
  const response = await api.update(repo, ghsaId, { state: "closed" });
  const adv = (await response.json()) as AdvisoryEntry;
  logger.success(`Closed advisory ${ghsaId}.`);
  return { success: true, advisory: adv };
};

const cveRequest = async (ghsaId: string, options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Requesting CVE for advisory ${ghsaId}.`);
  await api.requestCve(repo, ghsaId);
  logger.success(`CVE requested for advisory ${ghsaId}.`);
  return { success: true };
};

export default { list, view, create, publish, close, cveRequest };
