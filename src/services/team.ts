import api from "@/api/teams";
import type { GitHubTeam, GitHubTeamMember } from "@/api/teams";
import output from "@/core/output";
import logger from "@/core/logger";

interface Team {
  id: number;
  name: string;
  slug: string;
  privacy: string;
  description: string | null;
}

interface TeamMember {
  id: number;
  role: string;
  login: string;
}

const normalizeTeam = (team: GitHubTeam): Team => ({
  id: team.id,
  name: team.name,
  slug: team.slug,
  privacy: team.privacy,
  description: team.description,
});

const normalizeMember = (member: GitHubTeamMember): TeamMember => ({
  id: member.id,
  login: member.login,
  role: member.role || "member",
});

const list = async (org: string) => {
  logger.start(`Loading teams from organization ${org}.`);
  const response = await api.list(org);
  const data = (await response.json()) as GitHubTeam[];
  const teams = data.map(normalizeTeam);

  output.renderTable(
    teams.map((team) => ({
      name: team.name,
      slug: team.slug,
      privacy: team.privacy,
      description: team.description || "",
    })),
  );

  logger.success(
    teams.length ? `Loaded ${teams.length} team(s).` : "No teams found.",
  );

  return { success: true, metadata: teams };
};

const create = async (
  org: string,
  name: string,
  description: string,
  privacy: string,
) => {
  logger.start(`Creating team "${name}" in organization ${org}.`);
  const response = await api.create(org, name, description, privacy);
  const team = normalizeTeam((await response.json()) as GitHubTeam);

  logger.success(`Created team "${team.name}" in ${org}.`);
  return { success: true, metadata: team };
};

const listMembers = async (org: string, teamSlug: string) => {
  logger.start(`Loading members from team ${teamSlug}.`);
  const data = await api.listMembers(org, teamSlug);
  const members = data.map(normalizeMember);

  output.renderTable(
    members.map((member) => ({
      role: member.role,
      login: member.login,
    })),

    { emptyMessage: "No members found." },
  );

  logger.success(
    members.length
      ? `Loaded ${members.length} member(s).`
      : "No members found.",
  );

  return { success: true, metadata: members };
};

const addMember = async (
  org: string,
  teamSlug: string,
  username: string,
  role: string,
) => {
  logger.start(
    `Adding ${username} to team ${teamSlug} in organization ${org} as ${role}.`,
  );

  await api.addMember(org, teamSlug, username, role);
  logger.success(`Added ${username} to team ${teamSlug}.`);
  return { success: true, metadata: { org, teamSlug, username, role } };
};

const removeMember = async (
  org: string,
  teamSlug: string,
  username: string,
) => {
  logger.start(
    `Removing ${username} from team ${teamSlug} in organization ${org}.`,
  );

  await api.removeMember(org, teamSlug, username);
  logger.success(`Removed ${username} from team ${teamSlug}.`);
  return { success: true, metadata: { org, teamSlug, username } };
};

export default {
  list,
  create,
  addMember,
  listMembers,
  removeMember,
};

export type { Team, TeamMember };
