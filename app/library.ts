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
};

const labels = {
  list: async () => {
    console.info("Listing labels...");
    const response = await api.labels.fetch();
    const data = await response.json();

    const labels = data.map((label: Label) => ({
      name: label.name,
      color: label.color,
      description: label.description,
    }));

    console.info("Labels:");
    console.info(labels);
  },

  pull: async () => {
    console.info("Pulling labels...");
    const response = await api.labels.fetch();
    const data = await response.json();

    const labels = data.map((label: Label) => ({
      name: label.name,
      color: label.color,
      description: label.description,
    }));

    console.info("Saving labels...");

    try {
      fs.mkdirSync(METADATA_FOLDER, { recursive: true });
    } catch (error) {
      console.error(error);
    }

    try {
      fs.writeFileSync(
        `${METADATA_FOLDER}/${METADATA_FILE}`,
        JSON.stringify(labels, null, 2)
      );

      console.info("Labels saved.");
    } catch (error) {
      console.error(error);
    }
  },

  push: async () => {
    console.info("Pushing labels...");

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

    console.info("Labels pushed.");
  },

  prune: async () => {
    console.info("Pruning labels...");

    if (!fs.existsSync(`${METADATA_FOLDER}/${METADATA_FILE}`))
      throw new Error(ERROR_NO_METADATA);

    const data = fs.readFileSync(
      `${METADATA_FOLDER}/${METADATA_FILE}`,
      ENCODING
    );

    const labels = JSON.parse(data);
    labels.map(async (label: Label) => await api.labels.delete(label.name));
    console.info("Labels pruned.");
  },
};

export default {
  ping,
  labels,
};
