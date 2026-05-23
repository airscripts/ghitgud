import path from "path";
import io from "@/core/io";
import api from "@/api/labels";
import output from "@/core/output";
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
  output.renderTable(
    labels.map((label) => ({
      name: label.name,
      color: label.color,
      description: label.description,
    })),
  );
};

const getTemplatePath = (templateName: string, templatesDir: string) => {
  return path.join(templatesDir, `${templateName}.json`);
};

const loadLabelsFromPath = (filePath: string) => {
  return io.readJsonFile<Label[]>(filePath);
};

const loadLabelsFromTemplate = (templateName: string, templatesDir: string) => {
  const templatePath = getTemplatePath(templateName, templatesDir);

  if (!io.fileExists(templatePath)) {
    throw new Error(`Template "${templateName}" not found at ${templatePath}.`);
  }

  return loadLabelsFromPath(templatePath);
};

const loadLabelsFromMetadata = (metadataPath = METADATA_FILE_PATH) => {
  if (!io.fileExists(metadataPath)) throw new Error(ERROR_NO_METADATA);
  return loadLabelsFromPath(metadataPath);
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
  const labels = loadLabelsFromTemplate(templateName, templatesDir);
  io.ensureDir(GHITGUD_FOLDER);
  io.writeJsonFile(METADATA_FILE_PATH, labels);

  formatLabels(labels);
  logger.success(`Labels pulled from template "${templateName}".`);
  return { success: true, metadata: labels };
};

const hasJsonMethod = (
  response: unknown,
): response is { json: () => Promise<unknown> } => {
  return typeof (response as { json?: unknown }).json === "function";
};

const labelsEqual = (existing: Label, incoming: Label) => {
  const colorMatch = existing.color === incoming.color;
  const descriptionMatch = existing.description === incoming.description;
  const noRename = !incoming.newName;

  return colorMatch && descriptionMatch && noRename;
};

const upsertLabels = async (
  labels: Label[],
  repo?: string,
  options: { dryRun?: boolean } = {},
) => {
  logger.info(`Upserting ${labels.length} label(s).`);

  const results = await Promise.all(
    labels.map(async (label) => {
      try {
        const response = await api.get(label.name, repo);

        const existing = hasJsonMethod(response)
          ? normalizeLabel((await response.json()) as Label)
          : null;

        if (existing && labelsEqual(existing, label)) {
          return { action: "unchanged", name: label.name };
        }

        if (!options.dryRun) {
          await api.patch(label, repo);
        }

        return { action: "updated", name: label.name };
      } catch (error) {
        if (error instanceof NotFoundError) {
          if (!options.dryRun) {
            await api.create(label, repo);
          }

          return { action: "created", name: label.name };
        }

        throw error;
      }
    }),
  );

  return {
    created: results
      .filter((result) => result.action === "created")
      .map((result) => result.name),
    updated: results
      .filter((result) => result.action === "updated")
      .map((result) => result.name),
    unchanged: results
      .filter((result) => result.action === "unchanged")
      .map((result) => result.name),
  };
};

const push = async () => {
  logger.info("Pushing labels to repository.");
  const labels = loadLabelsFromMetadata();
  await upsertLabels(labels);

  logger.success("Labels pushed successfully.");
  return { success: true };
};

const pushTemplate = async (templateName: string, templatesDir: string) => {
  logger.info(`Pushing labels from template "${templateName}".`);
  const labels = loadLabelsFromTemplate(templateName, templatesDir);
  await upsertLabels(labels);

  logger.success(`Labels pushed from template "${templateName}".`);
  return { success: true };
};

const prune = async () => {
  const labels = loadLabelsFromMetadata();
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
  push,
  prune,
  pullTemplate,
  pushTemplate,
  upsertLabels,
  loadLabelsFromMetadata,
  loadLabelsFromTemplate,
};
