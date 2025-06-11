import fs from "fs";
import os from "os";
import path from "path";

import api from "./api";
import { Label } from "./types";
import functions from "./functions";

const ENCODING = "utf8";
const PING_RESPONSE = "pong";
const METADATA_FOLDER = "metadata";
const METADATA_FILE = "labels.json";
const ERROR_NO_METADATA = "No metadata file found.";

const CREDENTIALS_FILE = "credentials.json";
const ERROR_UNSUPPORTED_KEY = "Trying to set unsupported key.";
const GHITGUD_FOLDER = path.join(os.homedir(), ".config", "ghitgud");

const ping = () => {
  console.info(PING_RESPONSE);
  return { success: true };
};

const labels = {
  list: async () => {
    const response = await api.labels.fetch();
    const data = await response.json();

    const labels = data.map((label: Label) => ({
      name: label.name,
      color: label.color,
      description: label.description,
    }));

    const result = { success: true, metadata: labels };
    console.info(result);
    return result;
  },

  pull: async () => {
    const response = await api.labels.fetch();
    const data = await response.json();

    const labels = data.map((label: Label) => ({
      name: label.name,
      color: label.color,
      description: label.description,
    }));

    try {
      fs.mkdirSync(METADATA_FOLDER, { recursive: true });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }

    try {
      fs.writeFileSync(
        `${METADATA_FOLDER}/${METADATA_FILE}`,
        JSON.stringify(labels, null, 2)
      );
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }

    const result = { success: true };
    console.info(result);
    return result;
  },

  push: async () => {
    if (!fs.existsSync(`${METADATA_FOLDER}/${METADATA_FILE}`))
      throw new Error(ERROR_NO_METADATA);

    const data = fs.readFileSync(
      `${METADATA_FOLDER}/${METADATA_FILE}`,
      ENCODING
    );

    const labels = JSON.parse(data);

    await Promise.all(
      labels.map(async (label: Label) => {
        const response = await api.labels.get(label.name);
        if (functions.http.isOk(response.status)) await api.labels.patch(label);

        if (functions.http.isNotFound(response.status))
          await api.labels.create(label);
      })
    );

    const result = { success: true };
    console.info(result);
    return result;
  },

  prune: async () => {
    if (!fs.existsSync(`${METADATA_FOLDER}/${METADATA_FILE}`))
      throw new Error(ERROR_NO_METADATA);

    const data = fs.readFileSync(
      `${METADATA_FOLDER}/${METADATA_FILE}`,
      ENCODING
    );

    const labels = JSON.parse(data);
    labels.map(async (label: Label) => await api.labels.delete(label.name));

    const result = { success: true };
    console.info(result);
    return result;
  },
};

const config = {
  set: (key: string, value: string) => {
    const knowns = ["token", "repo"];

    if (!knowns.includes(key)) throw new Error(ERROR_UNSUPPORTED_KEY);

    if (!fs.existsSync(`${GHITGUD_FOLDER}/${CREDENTIALS_FILE}`)) {
      const credentials = { [key]: value };

      try {
        fs.mkdirSync(GHITGUD_FOLDER, { recursive: true });
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
      }

      fs.writeFileSync(
        `${GHITGUD_FOLDER}/${CREDENTIALS_FILE}`,
        JSON.stringify(credentials, null, 2)
      );

      return { success: true };
    }

    const data = fs.readFileSync(
      `${GHITGUD_FOLDER}/${CREDENTIALS_FILE}`,
      ENCODING
    );

    const credentials = JSON.parse(data);
    credentials[key] = value;

    fs.writeFileSync(
      `${GHITGUD_FOLDER}/${CREDENTIALS_FILE}`,
      JSON.stringify(credentials, null, 2)
    );

    return { success: true };
  },
};

export default {
  ping,
  labels,
  config,
};
