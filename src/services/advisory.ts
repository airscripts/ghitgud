import api from "@/api/advisories";
import output from "@/core/output";
import logger from "@/core/logger";

interface AdvisoryEntry {
  ghsaId: string;
  summary?: string;
  severity?: string;
  ecosystem?: string;
  cve_id?: string | null;
  published_at?: string;
  html_url?: string;
}

const list = async (
  options: { ecosystem?: string; severity?: string } = {},
) => {
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

const view = async (ghsaId: string) => {
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

export default { list, view };
