import { describe, it, expect } from "vitest";

import type {
  Environment,
  EnvironmentProtectionRule,
  EnvironmentListResponse,
} from "@/types/environments";

describe("environments types", () => {
  it("has Environment type with expected fields", () => {
    const env: Environment = {
      id: 1,
      name: "production",
      url: "https://api.github.com/repos/org/repo/environments/production",
      htmlUrl: "https://github.com/org/repo/settings/environments/1/edit",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      waitTimer: null,
      protectionRules: null,
    };

    expect(env.name).toBe("production");
    expect(env.waitTimer).toBeNull();
  });

  it("has EnvironmentProtectionRule type", () => {
    const rule: EnvironmentProtectionRule = {
      id: 1,
      waitTimer: null,
      type: "required_reviewers",
      reviewers: null,
      branchPolicy: null,
    };

    expect(rule.type).toBe("required_reviewers");
  });

  it("has EnvironmentListResponse type", () => {
    const res: EnvironmentListResponse = {
      totalCount: 0,
      environments: [],
    };

    expect(res.totalCount).toBe(0);
    expect(res.environments).toEqual([]);
  });
});
