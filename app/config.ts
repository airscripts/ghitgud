import functions from "./functions";
import "dotenv/config";

const config = {
  repo: process.env.GHITGUD_GITHUB_REPO || functions?.config.read("repo"),
  token: process.env.GHITGUD_GITHUB_TOKEN || functions?.config.read("token"),
};

export default config;
