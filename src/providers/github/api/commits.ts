import client from "@/providers/github/client";

interface ContributorResponse {
  id: number;
}

const commits = {
  contributors: async (repo: string): Promise<ContributorResponse[]> => {
    return client.getPaginated<ContributorResponse>(
      `/repos/${repo}/contributors?per_page=${client.getDefaultPerPage()}`,
    );
  },
};

export default commits;
