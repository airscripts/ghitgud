import client from "@/providers/github/client";
import { segment } from "./path";

const invites = {
  inviteCollaborator: async (
    owner: string,
    repo: string,
    username: string,
    permission: string,
  ): Promise<Response> => {
    return client.put(
      `/repos/${segment(owner)}/${segment(repo)}/collaborators/${segment(username)}`,
      {
        permission,
      },
    );
  },

  grantTeamAccess: async (
    owner: string,
    repo: string,
    teamSlug: string,
    permission: string,
  ): Promise<Response> => {
    return client.put(
      `/repos/${segment(owner)}/${segment(repo)}/teams/${segment(teamSlug)}`,
      {
        permission,
      },
    );
  },
};

export default invites;
