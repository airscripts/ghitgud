import output from "@/core/output";
import logger from "@/core/logger";
import reposApi from "@/api/repos";
import secretsApi from "@/api/secrets";
import { GhitgudError } from "@/core/errors";
import { encryptSecret } from "@/core/secrets";

import {
  ERROR_NO_REPO,
  ERROR_SECRET_NAME_REQUIRED,
  ERROR_SECRET_VALUE_REQUIRED,
} from "@/core/constants";

import {
  OrgSecret,
  RepoSecret,
  EnvironmentSecret,
  SecretListResponse,
} from "@/types";

function extractOwnerRepo(repo: string): [string, string] {
  const parts = repo.split("/");
  if (parts.length < 2) throw new GhitgudError("Invalid repository format.");
  return [parts[0], parts[1]];
}

async function getPublicKey(
  scope: "repo" | "org" | "env",
  ownerOrOrg: string,
  repo?: string,
  env?: string,
): Promise<{ keyId: string; key: string }> {
  let response: Response;

  if (scope === "org") {
    response = await secretsApi.getOrgPublicKey(ownerOrOrg);
  } else if (scope === "env" && repo && env) {
    response = await secretsApi.getEnvPublicKey(ownerOrOrg, repo, env);
  } else {
    response = await secretsApi.getRepoPublicKey(ownerOrOrg, repo!);
  }

  const data = (await response.json()) as { key_id: string; key: string };
  return { keyId: data.key_id, key: data.key };
}

async function resolveRepoIds(repoNames: string): Promise<number[]> {
  const names = repoNames.split(",").map((r) => r.trim());

  const ids = await Promise.all(
    names.map(async (name) => {
      if (!name.includes("/")) return undefined;

      try {
        const repo = await reposApi.get(name);
        return repo.id;
      } catch {
        return undefined;
      }
    }),
  );

  return ids.filter((id): id is number => id !== undefined);
}

const list = async (options: {
  repo?: string;
  env?: string;
  org?: string;
}): Promise<{ success: boolean; secrets: unknown[] }> => {
  if (options.org) {
    logger.start(`Loading organization secrets for ${options.org}.`);
    const response = await secretsApi.listOrg(options.org);
    const data = (await response.json()) as SecretListResponse<OrgSecret>;
    const secrets = data.secrets ?? [];

    output.renderTable(
      secrets.map((s) => ({
        name: s.name,
        updated: s.updatedAt,
        visibility: s.visibility,
      })),

      { emptyMessage: "No organization secrets found." },
    );

    logger.success(`Loaded ${secrets.length} organization secrets.`);
    return { success: true, secrets };
  }

  if (!options.repo) throw new GhitgudError(ERROR_NO_REPO);
  const [owner, repo] = extractOwnerRepo(options.repo);

  if (options.env) {
    logger.start(
      `Loading environment secrets for ${owner}/${repo} (${options.env}).`,
    );

    const response = await secretsApi.listEnv(owner, repo, options.env);

    const data =
      (await response.json()) as SecretListResponse<EnvironmentSecret>;

    const secrets = data.secrets ?? [];

    output.renderTable(
      secrets.map((s) => ({
        name: s.name,
        updated: s.updatedAt,
      })),

      { emptyMessage: `No secrets found for environment ${options.env}.` },
    );

    logger.success(`Loaded ${secrets.length} environment secrets.`);
    return { success: true, secrets };
  }

  logger.start(`Loading repository secrets for ${owner}/${repo}.`);
  const response = await secretsApi.listRepo(owner, repo);
  const data = (await response.json()) as SecretListResponse<RepoSecret>;
  const secrets = data.secrets ?? [];

  output.renderTable(
    secrets.map((s) => ({
      name: s.name,
      updated: s.updatedAt,
    })),
    { emptyMessage: "No repository secrets found." },
  );

  logger.success(`Loaded ${secrets.length} repository secrets.`);
  return { success: true, secrets };
};

const set = async (options: {
  name: string;
  value: string;
  repo?: string;
  env?: string;
  org?: string;
  visibility?: string;
  repos?: string;
}): Promise<{ success: boolean }> => {
  if (!options.name) throw new GhitgudError(ERROR_SECRET_NAME_REQUIRED);
  if (!options.value) throw new GhitgudError(ERROR_SECRET_VALUE_REQUIRED);

  let encryptedValue: string;

  if (options.org) {
    logger.start(`Setting organization secret ${options.name}.`);
    const { keyId, key } = await getPublicKey("org", options.org);
    encryptedValue = await encryptSecret(options.value, key);

    const selectedRepos = options.repos
      ? await resolveRepoIds(options.repos)
      : undefined;

    const isSelected = options.visibility === "selected";
    const hasSelectedRepos = selectedRepos && selectedRepos.length > 0;

    if (isSelected && !hasSelectedRepos) {
      throw new GhitgudError(
        "At least one valid repository is required when visibility is selected.",
      );
    }

    await secretsApi.setOrg(
      options.org,
      options.name,
      encryptedValue,
      keyId,
      (options.visibility as "all" | "private" | "selected") ?? "all",
      selectedRepos,
    );

    logger.success(`Set organization secret ${options.name}.`);
    return { success: true };
  }

  if (!options.repo) throw new GhitgudError(ERROR_NO_REPO);
  const [owner, repo] = extractOwnerRepo(options.repo);

  if (options.env) {
    logger.start(`Setting environment secret ${options.name}.`);
    const { keyId, key } = await getPublicKey("env", owner, repo, options.env);
    encryptedValue = await encryptSecret(options.value, key);

    await secretsApi.setEnv(
      owner,
      repo,
      options.env,
      options.name,
      encryptedValue,
      keyId,
    );

    logger.success(`Set environment secret ${options.name}.`);
    return { success: true };
  }

  logger.start(`Setting repository secret ${options.name}.`);
  const { keyId, key } = await getPublicKey("repo", owner, repo);
  encryptedValue = await encryptSecret(options.value, key);

  await secretsApi.setRepo(owner, repo, options.name, encryptedValue, keyId);
  logger.success(`Set repository secret ${options.name}.`);
  return { success: true };
};

const remove = async (options: {
  name: string;
  repo?: string;
  env?: string;
  org?: string;
}): Promise<{ success: boolean }> => {
  if (!options.name) throw new GhitgudError(ERROR_SECRET_NAME_REQUIRED);

  if (options.org) {
    logger.start(`Deleting organization secret ${options.name}.`);
    await secretsApi.deleteOrg(options.org, options.name);
    logger.success(`Deleted organization secret ${options.name}.`);
    return { success: true };
  }

  if (!options.repo) throw new GhitgudError(ERROR_NO_REPO);
  const [owner, repo] = extractOwnerRepo(options.repo);

  if (options.env) {
    logger.start(`Deleting environment secret ${options.name}.`);
    await secretsApi.deleteEnv(owner, repo, options.env, options.name);
    logger.success(`Deleted environment secret ${options.name}.`);
    return { success: true };
  }

  logger.start(`Deleting repository secret ${options.name}.`);
  await secretsApi.deleteRepo(owner, repo, options.name);
  logger.success(`Deleted repository secret ${options.name}.`);
  return { success: true };
};

export default { list, set, remove };
