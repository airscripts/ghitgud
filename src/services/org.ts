import api from "@/api/orgs";
import output from "@/core/output";
import logger from "@/core/logger";
import type { GitHubOrgMember } from "@/api/orgs";

interface OrgMember {
  id: number;
  role: string;
  login: string;
  avatarUrl: string;
  siteAdmin: boolean;
}

const normalizeMember = (member: GitHubOrgMember): OrgMember => ({
  login: member.login,
  id: member.id,
  avatarUrl: member.avatar_url,
  role: member.role || "member",
  siteAdmin: member.site_admin,
});

const list = async (org: string) => {
  logger.start(`Loading members from organization ${org}.`);
  const data = await api.listMembers(org);
  const members = data.map(normalizeMember);

  output.renderTable(
    members.map((member) => ({
      role: member.role,
      login: member.login,
      siteAdmin: member.siteAdmin ? "yes" : "no",
    })),
  );

  logger.success(
    members.length
      ? `Loaded ${members.length} member(s).`
      : "No members found.",
  );

  return { success: true, metadata: members };
};

const add = async (org: string, username: string, role: string) => {
  logger.start(`Adding ${username} to organization ${org} as ${role}.`);
  await api.inviteMember(org, username, role);

  logger.success(`Added ${username} to ${org}.`);
  return { success: true, metadata: { org, username, role } };
};

const remove = async (org: string, username: string) => {
  logger.start(`Removing ${username} from organization ${org}.`);
  await api.removeMember(org, username);

  logger.success(`Removed ${username} from ${org}.`);
  return { success: true, metadata: { org, username } };
};

export default {
  list,
  add,
  remove,
};

export type { OrgMember };
