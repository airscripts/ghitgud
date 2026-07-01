import client from "@/providers/github/client";

interface TrafficViewsResponse {
  count: number;
  uniques: number;
  views: Array<{
    count: number;
    uniques: number;
    timestamp: string;
  }>;
}

interface TrafficClonesResponse {
  count: number;
  uniques: number;
  clones: Array<{
    count: number;
    uniques: number;
    timestamp: string;
  }>;
}

interface Referrer {
  count: number;
  uniques: number;
  referrer: string;
}

interface PopularPath {
  path: string;
  title: string;
  count: number;
  uniques: number;
}

interface Contributor {
  id: number;
  login: string;
  contributions: number;
}

interface CommitActivity {
  week: number;
  total: number;
  days: number[];
}

const getTrafficViews = async (repo: string): Promise<TrafficViewsResponse> => {
  const response = await client.getTokenRequired(
    `/repos/${repo}/traffic/views`,
  );

  return (await response.json()) as TrafficViewsResponse;
};

const getTrafficClones = async (
  repo: string,
): Promise<TrafficClonesResponse> => {
  const response = await client.getTokenRequired(
    `/repos/${repo}/traffic/clones`,
  );

  return (await response.json()) as TrafficClonesResponse;
};

const getReferrers = async (repo: string): Promise<Referrer[]> => {
  const response = await client.getTokenRequired(
    `/repos/${repo}/traffic/popular/referrers`,
  );

  return (await response.json()) as Referrer[];
};

const getPopularPaths = async (repo: string): Promise<PopularPath[]> => {
  const response = await client.getTokenRequired(
    `/repos/${repo}/traffic/popular/paths`,
  );

  return (await response.json()) as PopularPath[];
};

const getContributors = async (repo: string): Promise<Contributor[]> => {
  const response = await client.get(`/repos/${repo}/contributors`);
  return (await response.json()) as Contributor[];
};

const getCommitActivity = async (repo: string): Promise<CommitActivity[]> => {
  const response = await client.get(`/repos/${repo}/stats/commit_activity`);
  return (await response.json()) as CommitActivity[];
};

const getCodeFrequency = async (
  repo: string,
): Promise<Array<[number, number, number]>> => {
  const response = await client.get(`/repos/${repo}/stats/code_frequency`);
  return (await response.json()) as Array<[number, number, number]>;
};

const getParticipation = async (
  repo: string,
): Promise<{
  all: number[];
  owner: number[];
}> => {
  const response = await client.get(`/repos/${repo}/stats/participation`);
  return (await response.json()) as { all: number[]; owner: number[] };
};

export default {
  getReferrers,
  getTrafficViews,
  getPopularPaths,
  getContributors,
  getTrafficClones,
  getCodeFrequency,
  getParticipation,
  getCommitActivity,
};
