import api from "@/api/dependencies";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GitfleetError } from "@/core/errors";

interface SbomPackage {
  name?: string;
  version?: string;
  ecosystem?: string;
  deps?: string;
}

const list = async (options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading dependency graph for ${repo}.`);
  const response = await api.sbom(repo);
  const data = (await response.json()) as Record<string, unknown>;
  const sbom = data.sbom as Record<string, unknown> | undefined;
  const packages = (sbom?.packages as SbomPackage[] | undefined) ?? [];
  output.renderTable(
    packages.map((pkg) => ({
      name: pkg.name ?? "-",
      version: pkg.version ?? "-",
      ecosystem: pkg.ecosystem ?? "-",
      deps: pkg.deps ?? "-",
    })),
    { emptyMessage: "No dependencies found." },
  );
  logger.success(`Loaded ${packages.length} dependenc(ies).`);
  return { success: true, packages };
};

const direct = async (options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading direct dependencies for ${repo}.`);
  const response = await api.sbom(repo);
  const data = (await response.json()) as Record<string, unknown>;
  const sbom = data.sbom as Record<string, unknown> | undefined;
  const packages = (sbom?.packages as SbomPackage[] | undefined) ?? [];
  const directPkgs = packages.filter((pkg) => !pkg.deps || pkg.deps === "-");
  output.renderTable(
    directPkgs.map((pkg) => ({
      name: pkg.name ?? "-",
      version: pkg.version ?? "-",
      ecosystem: pkg.ecosystem ?? "-",
    })),
    { emptyMessage: "No direct dependencies found." },
  );
  logger.success(`Loaded ${directPkgs.length} direct dependenc(ies).`);
  return { success: true, packages: directPkgs };
};

const review = async (options: {
  repo?: string;
  base?: string;
  head?: string;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  if (!options.base)
    throw new GitfleetError("--base is required for dependency review.");
  if (!options.head)
    throw new GitfleetError("--head is required for dependency review.");
  const basehead = `${options.base}...${options.head}`;
  logger.start(`Comparing dependencies for ${repo} (${basehead}).`);
  const response = await api.compare(repo, basehead);
  const changes = (await response.json()) as Array<Record<string, unknown>>;
  output.renderTable(
    changes.map((change) => ({
      change: (change.change_type as string) ?? "-",
      package:
        (change.package as Record<string, unknown> | undefined)?.name ??
        (change.name as string) ??
        "-",
      ecosystem:
        (change.package as Record<string, unknown> | undefined)?.ecosystem ??
        (change.ecosystem as string) ??
        "-",
      version:
        (change.package as Record<string, unknown> | undefined)?.version ??
        (change.version as string) ??
        "-",
      severity: (change.severity as string) ?? "-",
      vulnerability: (change.vulnerabilities as Array<unknown>)?.length ?? 0,
    })),
    { emptyMessage: "No dependency changes found." },
  );
  logger.success(`Loaded ${changes.length} change(s).`);
  return { success: true, changes };
};

export default { list, direct, review };
