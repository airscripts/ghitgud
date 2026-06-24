import client from "./client";

const milestones = {
  list: async (
    state: "open" | "closed" = "open",
    repo: string,
  ): Promise<Response> => {
    return client.get(
      `/repos/${repo}/milestones?state=${state}&per_page=${client.getDefaultPerPage()}`,
    );
  },

  create: async (
    options: { title: string; dueOn: string },
    repo: string,
  ): Promise<Response> => {
    return client.postTokenRequired(`/repos/${repo}/milestones`, {
      title: options.title,
      due_on: options.dueOn,
    });
  },

  close: async (number: number, repo: string): Promise<Response> => {
    return client.patchTokenRequired(`/repos/${repo}/milestones/${number}`, {
      state: "closed",
    });
  },
};

export default milestones;
