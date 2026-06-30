import client from "./client";

const list = (repo: string, subjectDigest: string): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/attestations/${encodeURIComponent(subjectDigest)}`,
  );

const verify = (repo: string, subjectDigest: string): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/attestations/${encodeURIComponent(subjectDigest)}`,
  );

export default { list, verify };
