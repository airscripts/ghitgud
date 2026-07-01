import api from "@/api/packages";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GitfleetError } from "@/core/errors";
import prompt from "@/core/prompt";

const VALID_PACKAGE_TYPES = [
  "npm",
  "maven",
  "rubygems",
  "docker",
  "container",
  "nuget",
  "pypi",
  "composer",
];

const list = async (
  options: { org?: string; repo?: string; packageType?: string } = {},
) => {
  if (
    options.packageType &&
    !VALID_PACKAGE_TYPES.includes(options.packageType)
  ) {
    throw new GitfleetError(
      `Invalid package type "${options.packageType}". Valid: ${VALID_PACKAGE_TYPES.join(", ")}.`,
    );
  }
  logger.start("Loading packages.");
  const response = await api.list({
    org: options.org,
    repo: options.repo,
    packageType: options.packageType,
  });
  const packages = (await response.json()) as Array<{
    id: number;
    name: string;
    package_type: string;
    visibility: string;
    html_url: string;
    owner: { login: string };
    repository: { full_name: string };
    created_at: string;
    updated_at: string;
  }>;
  output.renderTable(
    packages.map((pkg) => ({
      name: pkg.name,
      type: pkg.package_type,
      visibility: pkg.visibility,
      owner: pkg.owner?.login ?? "-",
      repo: pkg.repository?.full_name ?? "-",
    })),
    { emptyMessage: "No packages found." },
  );
  logger.success(`Loaded ${packages.length} package(s).`);
  return { success: true, packages };
};

const view = async (
  packageName: string,
  options: { repo?: string; packageType?: string } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const packageType = options.packageType ?? "npm";
  logger.start(`Loading package ${packageName}.`);
  const response = await api.get({
    repo,
    packageType,
    packageName,
  });
  const pkg = (await response.json()) as Record<string, unknown>;
  output.renderKeyValues([
    ["Name", String(pkg.name ?? "-")],
    ["Type", String(pkg.package_type ?? "-")],
    ["Visibility", String(pkg.visibility ?? "-")],
    ["Owner", (pkg.owner as { login: string })?.login ?? "-"],
    ["Created", String(pkg.created_at ?? "-")],
    ["Updated", String(pkg.updated_at ?? "-")],
    ["URL", String(pkg.html_url ?? "-")],
  ]);
  logger.success(`Loaded package ${packageName}.`);
  return { success: true, package: pkg };
};

const versionsList = async (
  packageName: string,
  options: { repo?: string; packageType?: string } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const packageType = options.packageType ?? "npm";
  logger.start(`Loading versions for ${packageName}.`);
  const response = await api.versions({ repo, packageType, packageName });
  const versions = (await response.json()) as Array<{
    id: number;
    name: string;
    version: string;
    html_url: string;
    created_at: string;
    updated_at: string;
  }>;
  output.renderTable(
    versions.map((v) => ({
      id: v.id,
      name: v.name ?? "-",
      version: v.version ?? "-",
      created: v.created_at ?? "-",
    })),
    { emptyMessage: "No versions found." },
  );
  logger.success(`Loaded ${versions.length} version(s).`);
  return { success: true, versions };
};

const deleteVersion = async (
  packageName: string,
  versionId: number,
  options: { repo?: string; packageType?: string; yes?: boolean } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const packageType = options.packageType ?? "npm";
  if (!options.yes) {
    prompt.guardNonInteractive("Package version deletion requires --yes.");
    if (
      !(await prompt.confirm(`Delete version ${versionId} of ${packageName}?`))
    )
      return { success: false };
  }
  logger.start(`Deleting version ${versionId} of ${packageName}.`);
  await api.deleteVersion({ repo, packageType, packageName, versionId });
  logger.success(`Deleted version ${versionId}.`);
  return { success: true };
};

const restoreVersion = async (
  packageName: string,
  versionId: number,
  options: { repo?: string; packageType?: string } = {},
) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const packageType = options.packageType ?? "npm";
  logger.start(`Restoring version ${versionId} of ${packageName}.`);
  await api.restoreVersion({ repo, packageType, packageName, versionId });
  logger.success(`Restored version ${versionId}.`);
  return { success: true };
};

export default { list, view, versionsList, deleteVersion, restoreVersion };
