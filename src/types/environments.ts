interface Environment {
  id: number;
  name: string;
  url: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  waitTimer: number | null;
  protectionRules: EnvironmentProtectionRule[] | null;
}

interface EnvironmentProtectionRule {
  id: number;
  waitTimer: number | null;
  type: "required_reviewers" | "branch_policy" | "wait_timer";

  reviewers: Array<{
    type: string;
    reviewer: { id: number; login: string; type: string };
  }> | null;

  branchPolicy: {
    protectedBranches: boolean;
    customBranchPolicies: boolean;
  } | null;
}

interface EnvironmentListResponse {
  totalCount: number;
  environments: Environment[];
}

export type { Environment };
export type { EnvironmentListResponse };
export type { EnvironmentProtectionRule };
