import client from "@/api/client";
import { repoPath } from "@/api/path";

const search = (query: string) => {
  const endpoint = `/copilot/skills/search?q=${encodeURIComponent(query)}`;
  return client.getTokenRequired(endpoint);
};

const getSkill = (repo: string, skill?: string) => {
  const base = repoPath(repo, "copilot-skills");
  const endpoint = skill ? `${base}/${skill}` : base;
  return client.getTokenRequired(endpoint);
};

const publish = (repo: string, manifest: Record<string, unknown>) => {
  return client.postTokenRequired(repoPath(repo, "copilot-skills"), manifest);
};

export default { search, getSkill, publish };
