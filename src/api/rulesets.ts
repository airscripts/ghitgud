import client from "./client";
import { RulesetInput } from "@/types";

interface RulesetResponse {
  id: number;
  name: string;
  [key: string]: unknown;
}

type RulesetTarget = { repo: string } | { org: string };

const basePath = (target: RulesetTarget): string =>
  "repo" in target
    ? `/repos/${target.repo}/rulesets`
    : `/orgs/${encodeURIComponent(target.org)}/rulesets`;

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

  listTarget: async (target: RulesetTarget): Promise<RulesetResponse[]> => {
    const response = await client.getTokenRequired(basePath(target));
    return (await response.json()) as RulesetResponse[];
  },

  getTarget: (target: RulesetTarget, id: number): Promise<Response> =>
    client.getTokenRequired(`${basePath(target)}/${id}`),

  createTarget: (target: RulesetTarget, ruleset: RulesetInput) =>
    client.postTokenRequired(basePath(target), ruleset),

  updateTarget: (target: RulesetTarget, id: number, ruleset: RulesetInput) =>
    client.putTokenRequired(`${basePath(target)}/${id}`, ruleset),

  deleteTarget: (target: RulesetTarget, id: number) =>
    client.deleteTokenRequired(`${basePath(target)}/${id}`),

  checkBranch: (repo: string, branch: string) =>
    client.getTokenRequired(
      `/repos/${repo}/rules/branches/${encodeURIComponent(branch)}`,
    ),
};

export default rulesets;
export type { RulesetTarget, RulesetResponse };
