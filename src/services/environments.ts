import output from "@/core/output";
import logger from "@/core/logger";
import config from "@/core/config";
import { GhitgudError } from "@/core/errors";
import environmentsApi from "@/api/environments";
import { ERROR_ENVIRONMENT_NAME_REQUIRED } from "@/core/constants";

import {
  Environment,
  EnvironmentListResponse,
  EnvironmentProtectionRule,
} from "@/types";

function extractOwnerRepo(): [string, string] {
  const repo = config.getRepo();
  const parts = repo.split("/");
  if (parts.length < 2) throw new GhitgudError("Invalid repository format.");
  return [parts[0], parts[1]];
}

const list = async (): Promise<{
  success: boolean;
  environments: Environment[];
}> => {
  const [owner, repo] = extractOwnerRepo();
  logger.start(`Loading environments for ${owner}/${repo}.`);

  const response = await environmentsApi.list(owner, repo);
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

const create = async (options: {
  name: string;
  waitTimer?: number;
}): Promise<{ success: boolean }> => {
  if (!options.name) throw new GhitgudError(ERROR_ENVIRONMENT_NAME_REQUIRED);

  const [owner, repo] = extractOwnerRepo();
  logger.start(`Creating environment ${options.name}.`);

  await environmentsApi.create(owner, repo, options.name, options.waitTimer);
  logger.success(`Created environment ${options.name}.`);
  return { success: true };
};

const listProtectionRules = async (
  env: string,
): Promise<{
  success: boolean;
  rules: EnvironmentProtectionRule[];
}> => {
  if (!env) throw new GhitgudError(ERROR_ENVIRONMENT_NAME_REQUIRED);

  const [owner, repo] = extractOwnerRepo();
  logger.start(`Loading protection rules for environment ${env}.`);

  const response = await environmentsApi.listProtectionRules(owner, repo, env);
  const rules = (await response.json()) as EnvironmentProtectionRule[];

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

const addProtectionRule = async (options: {
  env: string;
  type: "required_reviewers" | "branch_policy" | "wait_timer";
  value: Record<string, unknown>;
}): Promise<{ success: boolean }> => {
  if (!options.env) throw new GhitgudError(ERROR_ENVIRONMENT_NAME_REQUIRED);

  const [owner, repo] = extractOwnerRepo();
  logger.start(`Adding ${options.type} protection rule to ${options.env}.`);

  await environmentsApi.addProtectionRule(
    owner,
    repo,
    options.env,
    options.type,
    options.value,
  );

  logger.success(`Added ${options.type} protection rule.`);
  return { success: true };
};

const removeProtectionRule = async (options: {
  env: string;
  ruleId: number;
}): Promise<{ success: boolean }> => {
  if (!options.env) throw new GhitgudError(ERROR_ENVIRONMENT_NAME_REQUIRED);

  const [owner, repo] = extractOwnerRepo();
  logger.start(
    `Removing protection rule ${options.ruleId} from ${options.env}.`,
  );

  await environmentsApi.removeProtectionRule(
    owner,
    repo,
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
