import fs from "fs";
import path from "path";
import { load as yamlLoad } from "js-yaml";

import api, { RulesetTarget } from "@/api/rulesets";
import output from "@/core/output";
import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";
import { RulesetInput } from "@/types";

const VALID_TARGETS = new Set(["branch", "tag", "push", "repository"]);
const VALID_ENFORCEMENT = new Set(["disabled", "active", "evaluate"]);

const validateDefinition = (value: unknown): RulesetInput => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new GhitgudError("Ruleset definition must be an object.");
  }
  const ruleset = value as RulesetInput;
  if (!ruleset.name?.trim())
    throw new GhitgudError("Ruleset name is required.");
  if (ruleset.target && !VALID_TARGETS.has(ruleset.target)) {
    throw new GhitgudError(`Invalid ruleset target: ${ruleset.target}.`);
  }
  if (ruleset.enforcement && !VALID_ENFORCEMENT.has(ruleset.enforcement)) {
    throw new GhitgudError(
      `Invalid ruleset enforcement: ${ruleset.enforcement}.`,
    );
  }
  if (!Array.isArray(ruleset.rules)) {
    throw new GhitgudError("Ruleset rules must be an array.");
  }
  if (
    ruleset.conditions !== undefined &&
    (!ruleset.conditions ||
      typeof ruleset.conditions !== "object" ||
      Array.isArray(ruleset.conditions))
  ) {
    throw new GhitgudError("Ruleset conditions must be an object.");
  }
  return ruleset;
};

const readDefinition = (file: string): RulesetInput => {
  const absolutePath = path.resolve(file);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    throw new GhitgudError(`Ruleset file not found: ${file}.`);
  }
  try {
    return validateDefinition(yamlLoad(fs.readFileSync(absolutePath, "utf8")));
  } catch (error) {
    if (error instanceof GhitgudError) throw error;
    throw new GhitgudError(
      `Invalid ruleset file: ${error instanceof Error ? error.message : String(error)}.`,
    );
  }
};

const targetLabel = (target: RulesetTarget): string =>
  "repo" in target ? target.repo : target.org;

const list = async (target: RulesetTarget) => {
  const rulesets = await api.listTarget(target);
  output.renderTable(
    rulesets.map((ruleset) => ({
      id: ruleset.id,
      name: ruleset.name,
      target: ruleset.target ?? "-",
      enforcement: ruleset.enforcement ?? "-",
      source: ruleset.source ?? targetLabel(target),
    })),
    { emptyMessage: "No rulesets found." },
  );
  return { success: true, target, rulesets };
};

const view = async (id: number, target: RulesetTarget) => {
  const response = await api.getTarget(target, id);
  const ruleset = (await response.json()) as Record<string, unknown>;
  output.renderKeyValues([
    ["ID", id],
    ["Name", String(ruleset.name ?? "-")],
    ["Target", String(ruleset.target ?? "-")],
    ["Enforcement", String(ruleset.enforcement ?? "-")],
    ["Source", String(ruleset.source ?? targetLabel(target))],
  ]);
  output.renderTable(
    ((ruleset.rules as Array<Record<string, unknown>> | undefined) ?? []).map(
      (rule) => ({ type: rule.type ?? "-" }),
    ),
    { emptyMessage: "No rules configured." },
  );
  return { success: true, target, ruleset };
};

const check = async (repo: string, branch: string) => {
  const response = await api.checkBranch(repo, branch);
  const rules = (await response.json()) as Array<Record<string, unknown>>;
  output.renderTable(
    rules.map((rule) => ({
      type: rule.type ?? "-",
      rulesetId: rule.ruleset_id ?? "-",
      source: rule.source ?? "-",
    })),
    { emptyMessage: "No rules apply to this branch." },
  );
  return { success: true, repo, branch, rules };
};

const create = async (file: string, target: RulesetTarget) => {
  const definition = readDefinition(file);
  const response = await api.createTarget(target, definition);
  const ruleset = (await response.json()) as Record<string, unknown>;
  logger.success(`Created ruleset ${definition.name}.`);
  return { success: true, target, ruleset };
};

const edit = async (id: number, file: string, target: RulesetTarget) => {
  const definition = readDefinition(file);
  const response = await api.updateTarget(target, id, definition);
  const ruleset = (await response.json()) as Record<string, unknown>;
  logger.success(`Updated ruleset ${id}.`);
  return { success: true, target, ruleset };
};

const remove = async (id: number, target: RulesetTarget) => {
  await api.deleteTarget(target, id);
  logger.success(`Deleted ruleset ${id}.`);
  return { success: true, target, ruleset: id };
};

const validate = (file: string) => {
  const ruleset = readDefinition(file);
  logger.success(`Ruleset ${ruleset.name} is valid.`);
  return { success: true, ruleset };
};

export default { list, view, check, create, edit, remove, validate };
export { readDefinition, validateDefinition };
