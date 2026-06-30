import api from "@/api/protection";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GhitgudError } from "@/core/errors";

const protect = async (options: {
  repo?: string;
  branch: string;
  requiredChecks?: string[];
  requiredReviews?: number;
  dismissStale?: boolean;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Protecting branch ${options.branch} in ${repo}.`);
  const input: import("@/api/protection").BranchProtectionInput = {};

  if (options.requiredChecks?.length) {
    input.required_status_checks = {
      checks: options.requiredChecks.map((name) => ({ name })),
      strict: true,
    };
  }

  if (options.requiredReviews !== undefined || options.dismissStale) {
    input.required_pull_request_reviews = {
      required_approving_review_count: options.requiredReviews ?? 1,
      dismiss_stale_reviews: options.dismissStale ?? false,
    };
  }

  input.enforce_admins = true;
  input.restrictions = null;
  input.allow_force_pushes = false;

  const response = await api.protect(repo, options.branch, input);

  if (!response.ok && response.status !== 200) {
    const error = await response.json().catch(() => ({}));
    throw new GhitgudError(
      `Failed to protect branch: ${(error as Record<string, unknown>).message ?? response.statusText}`,
    );
  }

  logger.success(`Protected branch ${options.branch}.`);
  return { success: true, branch: options.branch, repo };
};

const unprotect = async (options: { repo?: string; branch: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Unprotecting branch ${options.branch} in ${repo}.`);
  await api.unprotect(repo, options.branch);
  logger.success(`Unprotected branch ${options.branch}.`);
  return { success: true, branch: options.branch, repo };
};

const listProtection = async (options: { repo?: string } = {}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading protected branches for ${repo}.`);
  const protected_ = await api.listBranchProtection(repo);
  const tagResponse = await api.listTagProtection(repo);
  const tagProtection = (await tagResponse.json()) as Array<{
    id: number;
    pattern: string;
    created_at: string;
  }>;

  output.renderSection("Branch Protection");
  output.renderTable(
    protected_.map((b) => ({ branch: b.branch, protected: "yes" })),
    { emptyMessage: "No protected branches." },
  );

  output.renderSection("Tag Protection");
  output.renderTable(
    tagProtection.map((t) => ({
      id: t.id,
      pattern: t.pattern,
      created: t.created_at,
    })),
    { emptyMessage: "No tag protection rules." },
  );

  logger.success(`Loaded protection rules for ${repo}.`);
  return { success: true, branches: protected_, tags: tagProtection };
};

const tagProtect = async (options: { repo?: string; pattern: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Creating tag protection rule ${options.pattern} in ${repo}.`);
  const response = await api.createTagProtection(repo, options.pattern);
  const result = (await response.json()) as { id: number; pattern: string };
  logger.success(
    `Created tag protection rule ${options.pattern} (id: ${result.id}).`,
  );
  return { success: true, rule: result };
};

const tagUnprotect = async (options: { repo?: string; pattern: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Finding tag protection rule ${options.pattern} in ${repo}.`);
  const response = await api.listTagProtection(repo);
  const rules = (await response.json()) as Array<{
    id: number;
    pattern: string;
  }>;
  const rule = rules.find((r) => r.pattern === options.pattern);

  if (!rule)
    throw new GhitgudError(
      `Tag protection rule "${options.pattern}" not found.`,
    );

  await api.deleteTagProtection(repo, rule.id);
  logger.success(`Deleted tag protection rule ${options.pattern}.`);
  return { success: true, pattern: options.pattern, id: rule.id };
};

export default {
  protect,
  unprotect,
  listProtection,
  tagProtect,
  tagUnprotect,
};
