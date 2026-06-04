import reposApi from "@/api/repos";
import logger from "@/core/logger";
import rulesetsApi from "@/api/rulesets";
import repoService from "@/services/repos";
import inspectService from "@/services/repos/inspect";
import { COMPLIANCE_CHECK_COUNT } from "@/core/constants";

import {
  RepoSummary,
  ComplianceCheck,
  ComplianceResult,
  RepoTargetOptions,
} from "@/types";

function check(
  id: string,
  label: string,
  passed: boolean,
  message: string,
): ComplianceCheck {
  return {
    id,
    label,
    message,
    status: passed ? "pass" : "fail",
  };
}

async function checkBranchProtection(
  repo: RepoSummary,
): Promise<ComplianceCheck> {
  try {
    await reposApi.getBranchProtection(repo.fullName, repo.defaultBranch);

    return check(
      "branch-protection",
      "Branch protection",
      true,
      `${repo.defaultBranch} is protected.`,
    );
  } catch {
    return check(
      "branch-protection",
      "Branch protection",
      false,
      `${repo.defaultBranch} has no readable branch protection.`,
    );
  }
}

async function checkRulesets(repo: RepoSummary): Promise<ComplianceCheck> {
  try {
    const rulesets = await rulesetsApi.list(repo.fullName);

    return check(
      "rulesets",
      "Rulesets",
      rulesets.length > 0,

      rulesets.length > 0
        ? `${rulesets.length} ruleset(s) found.`
        : "No repository rulesets found.",
    );
  } catch {
    return {
      id: "rulesets",
      label: "Rulesets",
      status: "unknown",
      message: "Rulesets are unavailable or require additional access.",
    };
  }
}

async function checkVulnerabilityAlerts(
  repo: RepoSummary,
): Promise<ComplianceCheck> {
  try {
    const details = await reposApi.get(repo.fullName);
    const enabled = details.has_vulnerability_alerts === true;

    return check(
      "vulnerability-alerts",
      "Vulnerability alerts",
      enabled,

      enabled
        ? "Vulnerability alerts are enabled."
        : "Vulnerability alerts are not enabled or not visible.",
    );
  } catch {
    return {
      status: "unknown",
      id: "vulnerability-alerts",
      label: "Vulnerability alerts",
      message: "Repository security settings are unavailable.",
    };
  }
}

async function evaluateRepo(repo: RepoSummary): Promise<ComplianceResult> {
  const inspect = await inspectService.inspectRepo(repo.fullName);
  const checks: ComplianceCheck[] = [
    check(
      "readme",
      "README",
      inspect.present.includes("README"),

      inspect.present.includes("README")
        ? "README is present."
        : "README is missing.",
    ),

    check(
      "license",
      "LICENSE",
      inspect.present.includes("LICENSE"),

      inspect.present.includes("LICENSE")
        ? "LICENSE is present."
        : "LICENSE is missing.",
    ),

    check(
      "security",
      "SECURITY.md",
      inspect.present.includes("SECURITY.md"),

      inspect.present.includes("SECURITY.md")
        ? "SECURITY.md is present."
        : "SECURITY.md is missing.",
    ),

    check(
      "codeowners",
      "CODEOWNERS",
      inspect.present.includes("CODEOWNERS"),

      inspect.present.includes("CODEOWNERS")
        ? "CODEOWNERS is present."
        : "CODEOWNERS is missing.",
    ),

    check(
      "active",
      "Repository active",
      !repo.archived,
      repo.archived ? "Repository is archived." : "Repository is active.",
    ),

    check(
      "default-branch",
      "Default branch",
      !!repo.defaultBranch,

      repo.defaultBranch
        ? `Default branch is ${repo.defaultBranch}.`
        : "Default branch is unavailable.",
    ),

    await checkBranchProtection(repo),
    await checkRulesets(repo),
    await checkVulnerabilityAlerts(repo),
  ];

  const passed = checks.filter((item) => item.status === "pass").length;
  const score = Math.round((passed / COMPLIANCE_CHECK_COUNT) * 100);

  return {
    score,
    checks,
    repo: repo.fullName,

    remediation: checks
      .filter((item) => item.status === "fail")
      .map((item) => item.message),
  };
}

const checkCompliance = async (options: RepoTargetOptions = {}) => {
  logger.start("Checking repository compliance.");
  const repos = await repoService.resolveTargets(options);

  const result = await repoService.runBulk<ComplianceResult>(
    repos,
    evaluateRepo,
  );

  repoService.renderBulkResults("Compliance Check", result, (_repo, data) => ({
    score: `${data.score}%`,
    passed: data.checks.filter((item) => item.status === "pass").length,
    failed: data.checks.filter((item) => item.status === "fail").length,
    unknown: data.checks.filter((item) => item.status === "unknown").length,
  }));

  return result;
};

export default { check: checkCompliance };
