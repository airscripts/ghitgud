import fs from "fs";
import api from "./api";
import { Label } from "./types";
import functions from "./functions";

const ENCODING = "utf8";
const PING_RESPONSE = "pong";
const METADATA_FOLDER = "metadata";
const METADATA_FILE = "labels.json";
const ERROR_NO_METADATA = "No metadata file found.";

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

    labels.map(async (label: Label) => {
      const foo = await api.labels.get(label.name);
      if (functions.http.isOk(foo.status)) await api.labels.patch(label);
      if (functions.http.isNotFound(foo.status)) await api.labels.create(label);
    });

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

export default {
  ping,
  labels,
};
