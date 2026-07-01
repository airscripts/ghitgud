import client from "@/providers/github/client";
import { segment } from "./path";

interface GitHubTeam {
  id: number;
  url: string;
  name: string;
  slug: string;
  privacy: string;
  description: string | null;
}

interface GitHubTeamMember {
  id: number;
  role: string;
  login: string;
}

const teams = {
  list: async (org: string): Promise<Response> => {
    return client.get(
      `/orgs/${segment(org)}/teams?per_page=${client.getDefaultPerPage()}`,
    );
  },

  create: async (
    org: string,
    name: string,
    description: string,
    privacy: string,
  ): Promise<Response> => {
    return client.post(`/orgs/${segment(org)}/teams`, {
      name,
      privacy,
      description,
    });
  },

  listMembers: async (
    org: string,
    teamSlug: string,
  ): Promise<GitHubTeamMember[]> => {
    return client.getPaginated<GitHubTeamMember>(
      `/orgs/${segment(org)}/teams/${segment(teamSlug)}/members?per_page=${client.getDefaultPerPage()}`,
    );
  },

  addMember: async (
    org: string,
    teamSlug: string,
    username: string,
    role: string,
  ): Promise<Response> => {
    return client.put(
      `/orgs/${segment(org)}/teams/${segment(teamSlug)}/memberships/${segment(username)}`,
      { role },
    );
  },

  removeMember: async (
    org: string,
    teamSlug: string,
    username: string,
  ): Promise<Response> => {
    return client.delete(
      `/orgs/${segment(org)}/teams/${segment(teamSlug)}/memberships/${segment(username)}`,
    );
  },
};

export default teams;
export type { GitHubTeam, GitHubTeamMember };
