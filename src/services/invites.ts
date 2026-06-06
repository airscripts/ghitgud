import api from "@/api/invites";
import logger from "@/core/logger";

const invite = async (
  owner: string,
  repo: string,
  username: string,
  permission: string,
) => {
  logger.start(`Inviting ${username} to ${owner}/${repo} as ${permission}.`);
  await api.inviteCollaborator(owner, repo, username, permission);

  logger.success(`Invited ${username} to ${owner}/${repo}.`);
  return { success: true, metadata: { owner, repo, username, permission } };
};

const grant = async (
  owner: string,
  repo: string,
  teamSlug: string,
  permission: string,
) => {
  logger.start(
    `Granting team ${teamSlug} access to ${owner}/${repo} as ${permission}.`,
  );

  await api.grantTeamAccess(owner, repo, teamSlug, permission);
  logger.success(`Granted team ${teamSlug} access to ${owner}/${repo}.`);
  return { success: true, metadata: { owner, repo, teamSlug, permission } };
};

export default {
  invite,
  grant,
};
