import path from "path";
import io from "@/core/io";
import api from "@/api/labels";
import client from "@/api/client";
import format from "@/core/format";
import { Label, normalizeLabel } from "@/types";

import {
  PING_RESPONSE,
  GHITGUD_FOLDER,
  ERROR_NO_METADATA,
  METADATA_FILE_PATH,
} from "@/core/constants";

const ping = () => {
  const result = { success: true, message: PING_RESPONSE };
  format.formatOutput(result);
  return result;
};

const list = async () => {
  const response = await api.fetch();
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));

  const result = { success: true, metadata: labels };
  format.formatOutput(result);
  return result;
};

const pull = async () => {
  const response = await api.fetch();
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));

  io.ensureDir(GHITGUD_FOLDER);
  io.writeJsonFile(METADATA_FILE_PATH, labels);

  const result = { success: true };
  format.formatOutput(result);
  return result;
};

const pullTemplate = async (templateName: string, templatesDir: string) => {
  const templatePath = path.join(templatesDir, `${templateName}.json`);
  if (!io.fileExists(templatePath)) {
    throw new Error(`Template "${templateName}" not found at ${templatePath}`);
  }

  const labels: Label[] = io.readJsonFile(templatePath);
  io.ensureDir(GHITGUD_FOLDER);
  io.writeJsonFile(METADATA_FILE_PATH, labels);

  const result = { success: true, metadata: labels };
  format.formatOutput(result);
  return result;
};

const upsertLabels = async (labels: Label[]) => {
  await Promise.all(
    labels.map(async (label) => {
      const response = await api.get(label.name);
      if (client.isOk(response.status)) {
        await api.patch(label);
      } else if (client.isNotFound(response.status)) {
        await api.create(label);
      }
    })
  );
};

const push = async () => {
  if (!io.fileExists(METADATA_FILE_PATH)) throw new Error(ERROR_NO_METADATA);
  const labels: Label[] = io.readJsonFile(METADATA_FILE_PATH);
  await upsertLabels(labels);

  const result = { success: true };
  format.formatOutput(result);
  return result;
};

const pushTemplate = async (templateName: string, templatesDir: string) => {
  const templatePath = path.join(templatesDir, `${templateName}.json`);
  if (!io.fileExists(templatePath)) {
    throw new Error(`Template "${templateName}" not found at ${templatePath}`);
  }

  const labels: Label[] = io.readJsonFile(templatePath);
  await upsertLabels(labels);

  const result = { success: true };
  format.formatOutput(result);
  return result;
};

const prune = async () => {
  if (!io.fileExists(METADATA_FILE_PATH)) throw new Error(ERROR_NO_METADATA);
  const labels: Label[] = io.readJsonFile(METADATA_FILE_PATH);

  await Promise.all(
    labels.map(async (label) => {
      await api.delete(label.name);
    })
  );

  const result = { success: true };
  format.formatOutput(result);
  return result;
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