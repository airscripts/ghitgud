import client from "@/api/client";
import { repoPath } from "@/api/path";

const list = () => {
  return client.get("/licenses");
};

const get = (key: string) => {
  return client.get(`/licenses/${key}`);
};

const repoLicense = (repo: string) => {
  return client.getTokenRequired(repoPath(repo, "license"));
};

export default { list, get, repoLicense };
