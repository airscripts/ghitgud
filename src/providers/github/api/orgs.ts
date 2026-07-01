import client from "@/providers/github/client";
import { segment } from "./path";

interface GitHubOrgMember {
  id: number;
  login: string;
  role?: string;
  avatar_url: string;
  site_admin: boolean;
}

const orgs = {
  listMembers: async (org: string): Promise<GitHubOrgMember[]> => {
    return client.getPaginated<GitHubOrgMember>(
      `/orgs/${segment(org)}/members?per_page=${client.getDefaultPerPage()}`,
    );
  },

  inviteMember: async (
    org: string,
    username: string,
    role: string,
  ): Promise<Response> => {
    return client.put(
      `/orgs/${segment(org)}/memberships/${segment(username)}`,
      {
        role,
      },
    );
  },

  removeMember: async (org: string, username: string): Promise<Response> => {
    return client.delete(
      `/orgs/${segment(org)}/memberships/${segment(username)}`,
    );
  },
};

export default orgs;
export type { GitHubOrgMember };
