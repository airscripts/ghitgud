import output from "@/core/output";
import logger from "@/core/logger";
import variablesApi from "@/api/variables";
import { GitfleetError } from "@/core/errors";

import {
  ERROR_NO_REPO,
  ERROR_VARIABLE_NAME_REQUIRED,
  ERROR_VARIABLE_VALUE_REQUIRED,
} from "@/core/constants";

import {
  OrgVariable,
  RepoVariable,
  EnvironmentVariable,
  VariableListResponse,
} from "@/types";

function extractOwnerRepo(repo: string): [string, string] {
  const parts = repo.split("/");
  if (parts.length < 2) throw new GitfleetError("Invalid repository format.");
  return [parts[0], parts[1]];
}

const list = async (options: {
  repo?: string;
  env?: string;
  org?: string;
}): Promise<{ success: boolean; variables: unknown[] }> => {
  if (options.org) {
    logger.start(`Loading organization variables for ${options.org}.`);
    const response = await variablesApi.listOrg(options.org);
    const data = (await response.json()) as VariableListResponse<OrgVariable>;

    const vars = data.variables ?? [];
    output.renderTable(
      vars.map((v) => ({
        name: v.name,
        updated: v.updatedAt,
        value: v.value ?? "***",
        visibility: v.visibility,
      })),

      { emptyMessage: "No organization variables found." },
    );

    logger.success(`Loaded ${vars.length} organization variables.`);
    return { success: true, variables: vars };
  }

  if (!options.repo) throw new GitfleetError(ERROR_NO_REPO);
  const [owner, repo] = extractOwnerRepo(options.repo);

  if (options.env) {
    logger.start(
      `Loading environment variables for ${owner}/${repo} (${options.env}).`,
    );

    const response = await variablesApi.listEnv(owner, repo, options.env);

    const data =
      (await response.json()) as VariableListResponse<EnvironmentVariable>;

    const vars = data.variables ?? [];
    output.renderTable(
      vars.map((v) => ({
        name: v.name,
        updated: v.updatedAt,
        value: v.value ?? "***",
      })),

      { emptyMessage: `No variables found for environment ${options.env}.` },
    );

    logger.success(`Loaded ${vars.length} environment variables.`);
    return { success: true, variables: vars };
  }

  logger.start(`Loading repository variables for ${owner}/${repo}.`);
  const response = await variablesApi.listRepo(owner, repo);
  const data = (await response.json()) as VariableListResponse<RepoVariable>;

  const vars = data.variables ?? [];
  output.renderTable(
    vars.map((v) => ({
      name: v.name,
      value: v.value ?? "***",
      updated: v.updatedAt,
    })),

    { emptyMessage: "No repository variables found." },
  );

  logger.success(`Loaded ${vars.length} repository variables.`);
  return { success: true, variables: vars };
};

const set = async (options: {
  name: string;
  value: string;
  repo?: string;
  env?: string;
  org?: string;
}): Promise<{ success: boolean }> => {
  if (!options.name) throw new GitfleetError(ERROR_VARIABLE_NAME_REQUIRED);
  if (!options.value) throw new GitfleetError(ERROR_VARIABLE_VALUE_REQUIRED);

  if (options.org) {
    logger.start(
      `Setting organization variable ${options.name} for ${options.org}.`,
    );

    try {
      await variablesApi.updateOrg(options.org, options.name, options.value);
    } catch {
      await variablesApi.setOrg(options.org, options.name, options.value);
    }

    logger.success(`Set organization variable ${options.name}.`);
    return { success: true };
  }

  if (!options.repo) throw new GitfleetError(ERROR_NO_REPO);
  const [owner, repo] = extractOwnerRepo(options.repo);

  if (options.env) {
    logger.start(
      `Setting environment variable ${options.name} for ${options.env}.`,
    );
    try {
      await variablesApi.updateEnv(
        owner,
        repo,
        options.env,
        options.name,
        options.value,
      );
    } catch {
      await variablesApi.setEnv(
        owner,
        repo,
        options.env,
        options.name,
        options.value,
      );
    }

    logger.success(`Set environment variable ${options.name}.`);
    return { success: true };
  }

  logger.start(`Setting repository variable ${options.name}.`);
  try {
    await variablesApi.updateRepo(owner, repo, options.name, options.value);
  } catch {
    await variablesApi.setRepo(owner, repo, options.name, options.value);
  }

  logger.success(`Set repository variable ${options.name}.`);
  return { success: true };
};

const remove = async (options: {
  name: string;
  repo?: string;
  env?: string;
  org?: string;
}): Promise<{ success: boolean }> => {
  if (!options.name) throw new GitfleetError(ERROR_VARIABLE_NAME_REQUIRED);

  if (options.org) {
    logger.start(
      `Deleting organization variable ${options.name} from ${options.org}.`,
    );

    await variablesApi.deleteOrg(options.org, options.name);
    logger.success(`Deleted organization variable ${options.name}.`);
    return { success: true };
  }

  if (!options.repo) throw new GitfleetError(ERROR_NO_REPO);
  const [owner, repo] = extractOwnerRepo(options.repo);

  if (options.env) {
    logger.start(
      `Deleting environment variable ${options.name} from ${options.env}.`,
    );

    await variablesApi.deleteEnv(owner, repo, options.env, options.name);
    logger.success(`Deleted environment variable ${options.name}.`);
    return { success: true };
  }

  logger.start(`Deleting repository variable ${options.name}.`);
  await variablesApi.deleteRepo(owner, repo, options.name);
  logger.success(`Deleted repository variable ${options.name}.`);
  return { success: true };
};

export default { list, set, remove };
