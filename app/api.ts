import { Label } from "./types";
import functions from "./functions";
import "dotenv/config";

const VERSION = "2022-11-28";
const REPO = "airscripts/ghitgud";
const BASE_URL = "https://api.github.com";
const ACCEPT = "application/vnd.github+json";
const AUTHORIZATION = `Bearer ${process.env.GITHUB_TOKEN}`;
const ERROR_UNAUTHORIZED = "Unauthorized.";
const ERROR_NO_TOKEN = "You must set the GITHUB_TOKEN environment variable.";

const labels = {
  fetch: async () => {
    if (!functions.environment.hasToken()) throw new Error(ERROR_NO_TOKEN);

    const response = await fetch(`${BASE_URL}/repos/${REPO}/labels`, {
      headers: {
        Accept: ACCEPT,
        Authorization: AUTHORIZATION,
        "X-GitHub-Api-Version": VERSION,
      },
    });

    if (functions.http.isNotAuthorized(response.status))
      throw new Error(ERROR_UNAUTHORIZED);
    return response;
  },

  get: async (name: string) => {
    if (!functions.environment.hasToken()) throw new Error(ERROR_NO_TOKEN);

    const response = await fetch(`${BASE_URL}/repos/${REPO}/labels/${name}`, {
      method: "GET",
      headers: {
        Accept: ACCEPT,
        Authorization: AUTHORIZATION,
        "X-GitHub-Api-Version": VERSION,
      },
    });

    if (functions.http.isNotAuthorized(response.status))
      throw new Error(ERROR_UNAUTHORIZED);
    return response;
  },

  create: async (label: Label) => {
    if (!functions.environment.hasToken()) throw new Error(ERROR_NO_TOKEN);

    const response = await fetch(`${BASE_URL}/repos/${REPO}/labels`, {
      method: "POST",

      body: JSON.stringify({
        name: label.name,
        color: label.color,
        description: label.description,
      }),

      headers: {
        Accept: ACCEPT,
        Authorization: AUTHORIZATION,
        "X-GitHub-Api-Version": VERSION,
      },
    });

    if (functions.http.isNotAuthorized(response.status))
      throw new Error(ERROR_UNAUTHORIZED);
    return response;
  },

  patch: async (label: Label) => {
    if (!functions.environment.hasToken()) throw new Error(ERROR_NO_TOKEN);

    const response = await fetch(
      `${BASE_URL}/repos/${REPO}/labels/${label.name}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          color: label.color,
          description: label.description,
          new_name: label.newName || label.name,
        }),

        headers: {
          Accept: ACCEPT,
          Authorization: AUTHORIZATION,
          "X-GitHub-Api-Version": VERSION,
        },
      }
    );

    if (functions.http.isNotAuthorized(response.status))
      throw new Error(ERROR_UNAUTHORIZED);
    return response;
  },

  delete: async (name: string) => {
    if (!functions.environment.hasToken()) throw new Error(ERROR_NO_TOKEN);

    const response = await fetch(`${BASE_URL}/repos/${REPO}/labels/${name}`, {
      method: "DELETE",

      headers: {
        Accept: ACCEPT,
        Authorization: AUTHORIZATION,
        "X-GitHub-Api-Version": VERSION,
      },
    });

    if (functions.http.isNotAuthorized(response.status))
      throw new Error(ERROR_UNAUTHORIZED);
    return response;
  },
};

export default {
  labels,
};
