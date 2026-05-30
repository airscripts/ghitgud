import client from "./client";

const listRunArtifacts = async (
  repo: string,
  runId: number,
): Promise<Response> => {
  return client.getTokenRequired(
    `/repos/${repo}/actions/runs/${runId}/artifacts`,
  );
};

const downloadArtifact = async (repo: string, artifactId: number) => {
  return client.getTokenRequired(
    `/repos/${repo}/actions/artifacts/${artifactId}/zip`,
  );
};

export default {
  listRunArtifacts,
  downloadArtifact,
};
