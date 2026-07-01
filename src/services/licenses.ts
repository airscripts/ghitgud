import pc from "picocolors";

import api from "@/api/licenses";
import output from "@/core/output";
import logger from "@/core/logger";
import spinner from "@/core/spinner";

import type { LicenseSummary, LicenseDetail } from "@/types";

const normalizeLicense = (raw: Record<string, unknown>): LicenseSummary => ({
  key: raw.key as string,
  name: raw.name as string,
  spdxId: (raw.spdx_id as string) ?? "",
  url: (raw.url as string) ?? "",
});

const normalizeLicenseDetail = (
  raw: Record<string, unknown>,
): LicenseDetail => ({
  key: raw.key as string,
  name: raw.name as string,
  spdxId: (raw.spdx_id as string) ?? "",
  url: (raw.url as string) ?? "",
  description: (raw.description as string) ?? "",
  implementation: (raw.implementation as string) ?? "",
  permissions: (raw.permissions as string[]) ?? [],
  conditions: (raw.conditions as string[]) ?? [],
  limitations: (raw.limitations as string[]) ?? [],
  body: (raw.body as string) ?? "",
});

const list = async () => {
  logger.start("Fetching licenses.");

  const response = await spinner.withSpinner(
    "Fetching licenses...",
    async () => api.list(),
    "Fetched licenses.",
  );

  const rawLicenses = (await response.json()) as Record<string, unknown>[];
  const licenses = rawLicenses.map(normalizeLicense);

  output.renderTable(
    licenses.map((l) => ({
      Key: l.key,
      Name: l.name,
      "SPDX ID": l.spdxId,
    })),
  );

  return { success: true, licenses };
};

const view = async (key: string) => {
  logger.start(`Fetching license "${key}".`);

  const response = await spinner.withSpinner(
    `Fetching license "${key}"...`,
    async () => api.get(key),
    `Fetched license "${key}".`,
  );

  const raw = (await response.json()) as Record<string, unknown>;
  const license = normalizeLicenseDetail(raw);

  output.renderSection(license.name);
  output.renderKeyValues([
    ["Key", license.key],
    ["SPDX ID", license.spdxId],
    ["URL", license.url],
  ]);

  if (license.description) {
    output.renderSection("Description");
    output.writeValue(license.description);
  }

  if (license.permissions.length) {
    output.renderSection("Permissions");
    output.writeValue(
      license.permissions.map((p) => pc.green(`  + ${p}`)).join("\n"),
    );
  }

  if (license.conditions.length) {
    output.renderSection("Conditions");
    output.writeValue(
      license.conditions.map((c) => pc.yellow(`  ! ${c}`)).join("\n"),
    );
  }

  if (license.limitations.length) {
    output.renderSection("Limitations");
    output.writeValue(
      license.limitations.map((l) => pc.red(`  - ${l}`)).join("\n"),
    );
  }

  return { success: true, license };
};

const repoList = async (repo: string) => {
  logger.start(`Fetching license for ${repo}.`);

  const response = await spinner.withSpinner(
    `Fetching license for ${repo}...`,
    async () => api.repoLicense(repo),
    `Fetched license for ${repo}.`,
  );

  const raw = (await response.json()) as Record<string, unknown>;
  const license = normalizeLicense(raw);

  output.renderSection(`License for ${repo}`);
  output.renderKeyValues([
    ["License", license.name],
    ["Key", license.key],
    ["SPDX ID", license.spdxId],
  ]);

  return { success: true, license, repo };
};

export default { list, view, repoList };
