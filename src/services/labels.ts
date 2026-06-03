import path from "path";
import io from "@/core/io";
import api from "@/api/labels";
import output from "@/core/output";
import logger from "@/core/logger";
import { Label, normalizeLabel } from "@/types";
import { GhitgudError, NotFoundError } from "@/core/errors";

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
    throw new GhitgudError(
      `Template "${templateName}" not found at ${templatePath}.`,
    );
  }

  return loadLabelsFromPath(templatePath);
};

const loadLabelsFromMetadata = (metadataPath = METADATA_FILE_PATH) => {
  if (!io.fileExists(metadataPath)) throw new GhitgudError(ERROR_NO_METADATA);
  return loadLabelsFromPath(metadataPath);
};

const ping = () => {
  logger.success(PING_RESPONSE + ".");
  return { success: true, message: PING_RESPONSE };
};

const list = async () => {
  logger.start("Loading labels from the repository.");
  const response = await api.fetch();
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));

  formatLabels(labels);
  logger.success(
    labels.length ? `Loaded ${labels.length} label(s).` : "No labels found.",
  );

  return { success: true, metadata: labels };
};

const pull = async () => {
  logger.start("Pulling labels from the repository.");
  const response = await api.fetch();
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));

  io.ensureDir(GHITGUD_FOLDER);
  io.writeJsonFile(METADATA_FILE_PATH, labels);

  logger.success(`Saved ${labels.length} label(s) to local metadata.`);
  return { success: true, metadata: labels };
};

const pullTemplate = async (templateName: string, templatesDir: string) => {
  logger.start(`Loading labels from the "${templateName}" template.`);
  const labels = loadLabelsFromTemplate(templateName, templatesDir);
  io.ensureDir(GHITGUD_FOLDER);
  io.writeJsonFile(METADATA_FILE_PATH, labels);

  formatLabels(labels);
  logger.success(
    `Saved ${labels.length} template label(s) from "${templateName}".`,
  );

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
  logger.start(
    `${options.dryRun ? "Previewing" : "Syncing"} ${labels.length} label(s).`,
  );

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
  logger.start("Syncing local metadata labels to the repository.");
  const labels = loadLabelsFromMetadata();
  const result = await upsertLabels(labels);

  output.renderSummary("Label Sync", [
    ["Created", result.created.length],
    ["Updated", result.updated.length],
    ["Unchanged", result.unchanged.length],
  ]);

  logger.success("Repository labels are up to date.");
  return { success: true, metadata: result };
};

const pushTemplate = async (templateName: string, templatesDir: string) => {
  logger.start(`Syncing the "${templateName}" label template.`);
  const labels = loadLabelsFromTemplate(templateName, templatesDir);
  const result = await upsertLabels(labels);

  output.renderSummary("Label Sync", [
    ["Created", result.created.length],
    ["Updated", result.updated.length],
    ["Unchanged", result.unchanged.length],
  ]);

  logger.success(`Template "${templateName}" applied successfully.`);
  return { success: true, metadata: result };
};

const prune = async () => {
  const labels = loadLabelsFromMetadata();
  logger.start(`Deleting ${labels.length} label(s) from the repository.`);

  await Promise.all(
    labels.map(async (label) => {
      await api.delete(label.name);
    }),
  );

  logger.success(`Deleted ${labels.length} label(s).`);
  return { success: true, metadata: { deleted: labels.length } };
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
