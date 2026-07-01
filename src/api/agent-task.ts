import client from "@/api/client";

const create = (description: string, repo?: string) => {
  const endpoint = repo ? `/repos/${repo}/copilot-tasks` : "/copilot-tasks";

  return client.postTokenRequired(endpoint, { description });
};

const list = (repo?: string) => {
  const endpoint = repo ? `/repos/${repo}/copilot-tasks` : "/copilot-tasks";

  return client.getTokenRequired(endpoint);
};

const view = (sessionId: string, repo?: string) => {
  const endpoint = repo
    ? `/repos/${repo}/copilot-tasks/${sessionId}`
    : `/copilot-tasks/${sessionId}`;

  return client.getTokenRequired(endpoint);
};

export default { create, list, view };
