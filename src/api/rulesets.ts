import client from "./client";
import { RulesetInput } from "@/types";

interface RulesetResponse {
  id: number;
  name: string;
}

const rulesets = {
  list: async (repo: string): Promise<RulesetResponse[]> => {
    const response = await client.get(`/repos/${repo}/rulesets`);
    return (await response.json()) as RulesetResponse[];
  },

  create: async (repo: string, ruleset: RulesetInput): Promise<Response> => {
    return client.post(`/repos/${repo}/rulesets`, ruleset);
  },

  update: async (
    repo: string,
    rulesetId: number,
    ruleset: RulesetInput,
  ): Promise<Response> => {
    return client.put(`/repos/${repo}/rulesets/${rulesetId}`, ruleset);
  },
};

export default rulesets;
