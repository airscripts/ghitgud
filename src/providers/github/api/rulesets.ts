import client from "@/providers/github/client";
import { RulesetInput } from "@/types";
import type { PolicyTarget } from "@/domain/provider";

interface RulesetResponse {
  id: number;
  name: string;
  [key: string]: unknown;
}

const basePath = (target: PolicyTarget): string =>
  "repository" in target
    ? `/repos/${target.repository}/rulesets`
    : `/orgs/${encodeURIComponent(target.namespace)}/rulesets`;

const rulesets = {
  list: async (repo: string): Promise<RulesetResponse[]> => {
    const response = await client.get(`/repos/${repo}/rulesets`);
    return (await response.json()) as RulesetResponse[];
  },

  create: async (repo: string, ruleset: RulesetInput): Promise<Response> => {
    return client.postTokenRequired(`/repos/${repo}/rulesets`, ruleset);
  },

  update: async (
    repo: string,
    rulesetId: number,
    ruleset: RulesetInput,
  ): Promise<Response> => {
    return client.putTokenRequired(
      `/repos/${repo}/rulesets/${rulesetId}`,
      ruleset,
    );
  },

  listTarget: async (target: PolicyTarget): Promise<RulesetResponse[]> => {
    const response = await client.getTokenRequired(basePath(target));
    return (await response.json()) as RulesetResponse[];
  },

  getTarget: (target: PolicyTarget, id: number): Promise<Response> =>
    client.getTokenRequired(`${basePath(target)}/${id}`),

  createTarget: (target: PolicyTarget, ruleset: RulesetInput) =>
    client.postTokenRequired(basePath(target), ruleset),

  updateTarget: (target: PolicyTarget, id: number, ruleset: RulesetInput) =>
    client.putTokenRequired(`${basePath(target)}/${id}`, ruleset),

  deleteTarget: (target: PolicyTarget, id: number) =>
    client.deleteTokenRequired(`${basePath(target)}/${id}`),

  checkBranch: (repo: string, branch: string) =>
    client.getTokenRequired(
      `/repos/${repo}/rules/branches/${encodeURIComponent(branch)}`,
    ),
};

export default rulesets;
export type { RulesetResponse };
