import path from "path";

import io from "@/core/io";
import api from "@/api/labels";
import logger from "@/core/logger";
import { NotFoundError } from "@/core/errors";
import { Label, normalizeLabel } from "@/types";

import {
  PING_RESPONSE,
  GHITGUD_FOLDER,
  ERROR_NO_METADATA,
  METADATA_FILE_PATH,
} from "@/core/constants";

const formatLabels = (labels: Label[]) => {
  const rows = labels.map((label) => ({
    name: label.name,
    color: label.color,
    description: label.description,
  }));

  console.log();
  console.table(rows);
};

const ping = () => {
  logger.success(PING_RESPONSE + ".");
  return { success: true, message: PING_RESPONSE };
};

const list = async () => {
  logger.info("Fetching labels from repository.");
  const response = await api.fetch();
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));

  formatLabels(labels);
  return { success: true, metadata: labels };
};

const pull = async () => {
  logger.info("Pulling labels from repository.");
  const response = await api.fetch();
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));

  io.ensureDir(GHITGUD_FOLDER);
  io.writeJsonFile(METADATA_FILE_PATH, labels);

  logger.success("Labels pulled successfully.");
  return { success: true, metadata: labels };
};

const pullTemplate = async (templateName: string, templatesDir: string) => {
  logger.info(`Pulling labels from template "${templateName}".`);
  const templatePath = path.join(templatesDir, `${templateName}.json`);

  if (!io.fileExists(templatePath)) {
    throw new Error(`Template "${templateName}" not found at ${templatePath}.`);
  }

  const labels: Label[] = io.readJsonFile(templatePath);
  io.ensureDir(GHITGUD_FOLDER);
  io.writeJsonFile(METADATA_FILE_PATH, labels);

  formatLabels(labels);
  logger.success(`Labels pulled from template "${templateName}".`);
  return { success: true, metadata: labels };
};

const upsertLabels = async (labels: Label[]) => {
  logger.info(`Upserting ${labels.length} label(s).`);

  await Promise.all(
    labels.map(async (label) => {
      try {
        await api.get(label.name);
        await api.patch(label);
      } catch (error) {
        if (error instanceof NotFoundError) {
          await api.create(label);
        } else {
          throw error;
        }
      }
    }),
  );
};

const push = async () => {
  if (!io.fileExists(METADATA_FILE_PATH)) throw new Error(ERROR_NO_METADATA);
  logger.info("Pushing labels to repository.");
  const labels: Label[] = io.readJsonFile(METADATA_FILE_PATH);
  await upsertLabels(labels);

  logger.success("Labels pushed successfully.");
  return { success: true };
};

const pushTemplate = async (templateName: string, templatesDir: string) => {
  logger.info(`Pushing labels from template "${templateName}".`);
  const templatePath = path.join(templatesDir, `${templateName}.json`);

  if (!io.fileExists(templatePath)) {
    throw new Error(`Template "${templateName}" not found at ${templatePath}.`);
  }

  const labels: Label[] = io.readJsonFile(templatePath);
  await upsertLabels(labels);

  logger.success(`Labels pushed from template "${templateName}".`);
  return { success: true };
};

const prune = async () => {
  if (!io.fileExists(METADATA_FILE_PATH)) throw new Error(ERROR_NO_METADATA);
  const labels: Label[] = io.readJsonFile(METADATA_FILE_PATH);
  logger.info(`Pruning ${labels.length} label(s) from repository.`);

  await Promise.all(
    labels.map(async (label) => {
      await api.delete(label.name);
    }),
  );

  logger.success("Labels pruned successfully.");
  return { success: true };
};

export default {
  ping,
  list,
  pull,
  pullTemplate,
  push,
  pushTemplate,
  prune,
};
