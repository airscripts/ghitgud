import api from "@/api/attestations";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";

interface AttestationEntry {
  bundle_type: string;
  predicate_type: string;
  subject_digest: Record<string, string>;
  repository_id: number;
  created_at: string;
}

const list = async (subjectDigest: string, options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading attestations for ${subjectDigest.slice(0, 16)}.`);
  const response = await api.list(repo, subjectDigest);
  const data = (await response.json()) as { attestations: AttestationEntry[] };
  output.renderTable(
    data.attestations.map((att) => ({
      type: att.bundle_type ?? "-",
      predicate: att.predicate_type ?? "-",
      created: att.created_at ?? "-",
    })),
    { emptyMessage: "No attestations found." },
  );
  logger.success(`Loaded ${data.attestations.length} attestation(s).`);
  return { success: true, attestations: data.attestations };
};

const verify = async (
  subjectDigest: string,
  options: { repo?: string } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Verifying attestation for ${subjectDigest.slice(0, 16)}.`);
  const response = await api.verify(repo, subjectDigest);
  const data = (await response.json()) as { attestations: AttestationEntry[] };
  if (data.attestations.length === 0) {
    output.renderKeyValues([
      ["Digest", subjectDigest],
      ["Verified", "no attestations found"],
    ]);
  } else {
    output.renderKeyValues([
      ["Digest", subjectDigest],
      ["Attestations", String(data.attestations.length)],
      ["Verified", "yes"],
      ["Predicate", data.attestations[0].predicate_type ?? "-"],
    ]);
  }
  logger.success(`Verification complete.`);
  return { success: true, attestations: data.attestations };
};

export default { list, verify };
