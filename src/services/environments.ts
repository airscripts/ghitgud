import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import environmentsApi from "@/api/environments";
import { ERROR_ENVIRONMENT_NAME_REQUIRED } from "@/core/constants";

import {
  Environment,
  EnvironmentListResponse,
  EnvironmentProtectionRule,
} from "@/types";

function extractOwnerRepo(repo: string): [string, string] {
  const parts = repo.split("/");
  if (parts.length < 2) throw new GhitgudError("Invalid repository format.");
  return [parts[0], parts[1]];
}

const list = async (
  repo: string,
): Promise<{
  success: boolean;
  environments: Environment[];
}> => {
  const [owner, name] = extractOwnerRepo(repo);
  logger.start(`Loading environments for ${owner}/${name}.`);

  const response = await environmentsApi.list(owner, name);
  const data = (await response.json()) as EnvironmentListResponse;
  const environments = data.environments ?? [];

  output.renderTable(
    environments.map((env) => ({
      name: env.name,
      url: env.htmlUrl,
      created: env.createdAt,
      updated: env.updatedAt,
    })),
    { emptyMessage: "No environments found." },
  );

  logger.success(`Loaded ${environments.length} environments.`);
  return { success: true, environments };
};

const create = async (
  repo: string,
  options: {
    name: string;
    waitTimer?: number;
  },
): Promise<{ success: boolean }> => {
  if (!options.name) throw new GhitgudError(ERROR_ENVIRONMENT_NAME_REQUIRED);

  const [owner, name] = extractOwnerRepo(repo);
  logger.start(`Creating environment ${options.name}.`);

  await environmentsApi.create(owner, name, options.name, options.waitTimer);
  logger.success(`Created environment ${options.name}.`);
  return { success: true };
};

const listProtectionRules = async (
  repo: string,
  env: string,
): Promise<{
  success: boolean;
  rules: EnvironmentProtectionRule[];
}> => {
  if (!env) throw new GhitgudError(ERROR_ENVIRONMENT_NAME_REQUIRED);

  const [owner, name] = extractOwnerRepo(repo);
  logger.start(`Loading protection rules for environment ${env}.`);

  const response = await environmentsApi.listProtectionRules(owner, name, env);
  const data = await response.json();
  const rules: EnvironmentProtectionRule[] = Array.isArray(data) ? data : [];

  output.renderTable(
    rules.map((rule) => ({
      id: String(rule.id),
      type: rule.type,
      waitTimer: rule.waitTimer ?? "-",

      reviewers:
        rule.reviewers
          ?.map((r) => `${r.reviewer.login} (${r.type})`)
          .join(", ") ?? "-",

      branchPolicy: rule.branchPolicy
        ? `${rule.branchPolicy.protectedBranches ? "protected" : "custom"}`
        : "-",
    })),

    { emptyMessage: "No protection rules found." },
  );

  logger.success(`Loaded ${rules.length} protection rules.`);
  return { success: true, rules };
};

const addProtectionRule = async (
  repo: string,
  options: {
    env: string;
    type: "required_reviewers" | "branch_policy" | "wait_timer";
    value: Record<string, unknown>;
  },
): Promise<{ success: boolean }> => {
  if (!options.env) throw new GhitgudError(ERROR_ENVIRONMENT_NAME_REQUIRED);

  const [owner, name] = extractOwnerRepo(repo);
  logger.start(`Adding ${options.type} protection rule to ${options.env}.`);

  await environmentsApi.addProtectionRule(
    owner,
    name,
    options.env,
    options.type,
    options.value,
  );

  logger.success(`Added ${options.type} protection rule.`);
  return { success: true };
};

const removeProtectionRule = async (
  repo: string,
  options: {
    env: string;
    ruleId: number;
  },
): Promise<{ success: boolean }> => {
  if (!options.env) throw new GhitgudError(ERROR_ENVIRONMENT_NAME_REQUIRED);

  const [owner, name] = extractOwnerRepo(repo);
  logger.start(
    `Removing protection rule ${options.ruleId} from ${options.env}.`,
  );

  await environmentsApi.removeProtectionRule(
    owner,
    name,
    options.env,
    options.ruleId,
  );

  logger.success(`Removed protection rule ${options.ruleId}.`);
  return { success: true };
};

export default {
  list,
  create,
  addProtectionRule,
  listProtectionRules,
  removeProtectionRule,
};
