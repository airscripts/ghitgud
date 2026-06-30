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

    { emptyMessage: "No labels found." },
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

const list = async (repo: string) => {
  logger.start("Loading labels from the repository.");
  const response = await api.fetch(repo);
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));

  formatLabels(labels);
  logger.success(
    labels.length ? `Loaded ${labels.length} label(s).` : "No labels found.",
  );

  return { success: true, metadata: labels };
};

const pull = async (repo: string) => {
  logger.start("Pulling labels from the repository.");
  const response = await api.fetch(repo);
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
  repo: string,
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

const push = async (repo: string) => {
  logger.start("Syncing local metadata labels to the repository.");
  const labels = loadLabelsFromMetadata();
  const result = await upsertLabels(labels, repo);

  output.renderSummary("Label Sync", [
    ["Created", result.created.length],
    ["Updated", result.updated.length],
    ["Unchanged", result.unchanged.length],
  ]);

  logger.success("Repository labels are up to date.");
  return { success: true, metadata: result };
};

const pushTemplate = async (
  templateName: string,
  templatesDir: string,
  repo: string,
) => {
  logger.start(`Syncing the "${templateName}" label template.`);
  const labels = loadLabelsFromTemplate(templateName, templatesDir);
  const result = await upsertLabels(labels, repo);

  output.renderSummary("Label Sync", [
    ["Created", result.created.length],
    ["Updated", result.updated.length],
    ["Unchanged", result.unchanged.length],
  ]);

  logger.success(`Template "${templateName}" applied successfully.`);
  return { success: true, metadata: result };
};

const create = async (
  name: string,
  options: { color?: string; description?: string } = {},
  repo: string,
) => {
  const color = options.color ?? "ededed";
  const description = options.description ?? "";

  logger.start(`Creating label "${name}".`);
  const response = await api.create({ name, color, description }, repo);
  const data = (await response.json()) as Label;
  const label = normalizeLabel(data);

  output.renderSummary(`Label "${name}"`, [
    ["Name", label.name],
    ["Color", label.color],
    ["Description", label.description || "-"],
  ]);

  logger.success(`Label "${name}" created.`);
  return { success: true, label };
};

const get = async (name: string, repo: string) => {
  logger.start(`Loading label "${name}".`);
  const response = await api.get(name, repo);
  const data = (await response.json()) as Label;
  const label = normalizeLabel(data);

  output.renderSummary(`Label "${name}"`, [
    ["Name", label.name],
    ["Color", label.color],
    ["Description", label.description || "-"],
  ]);

  logger.success(`Label "${name}" loaded.`);
  return { success: true, label };
};

const update = async (
  name: string,
  options: { newName?: string; color?: string; description?: string },
  repo: string,
) => {
  if (!options.newName && !options.color && !options.description) {
    throw new GhitgudError(
      "At least one of --new-name, --color, or --description is required.",
    );
  }

  logger.start(`Updating label "${name}".`);
  const label: Label = {
    name,
    color: options.color ?? "",
    description: options.description ?? "",
  };

  if (options.newName) {
    label.newName = options.newName;
  }

  const response = await api.patch(label, repo);
  const data = (await response.json()) as Label;
  const updated = normalizeLabel(data);

  output.renderSummary(`Label "${name}" updated`, [
    ["Name", updated.name],
    ["Color", updated.color],
    ["Description", updated.description || "-"],
  ]);

  logger.success(`Label "${name}" updated.`);
  return { success: true, label: updated };
};

const deleteLabel = async (
  name: string,
  repo: string,
  options: { yes?: boolean } = {},
) => {
  if (!options.yes) {
    throw new GhitgudError(
      "This operation deletes a label. Re-run with --yes to apply.",
    );
  }

  logger.start(`Deleting label "${name}".`);
  await api.delete(name, repo);
  logger.success(`Label "${name}" deleted.`);
  return { success: true, deleted: name };
};

const clone = async (sourceRepo: string, targetRepo: string) => {
  logger.start(`Cloning labels from ${sourceRepo} to ${targetRepo}.`);
  const response = await api.fetch(sourceRepo);
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));
  const result = await upsertLabels(labels, targetRepo);

  output.renderSummary("Label Clone", [
    ["Source", sourceRepo],
    ["Target", targetRepo],
    ["Created", result.created.length],
    ["Updated", result.updated.length],
    ["Unchanged", result.unchanged.length],
  ]);

  logger.success(`Cloned ${labels.length} label(s) to ${targetRepo}.`);
  return { success: true, metadata: result };
};

const prune = async (
  repo: string,
  options: { dryRun?: boolean; yes?: boolean } = {},
) => {
  const labels = loadLabelsFromMetadata();

  if (options.dryRun) {
    logger.start(`Previewing deletion of ${labels.length} label(s).`);

    output.renderTable(
      labels.map((label) => ({
        name: label.name,
        color: label.color,
        description: label.description,
      })),

      { emptyMessage: "No labels to prune." },
    );

    logger.success(`${labels.length} label(s) would be deleted.`);
    return { success: true, metadata: { deleted: labels.length } };
  }

  if (!options.yes) {
    throw new GhitgudError(
      "This operation deletes labels. Re-run with --yes to apply.",
    );
  }

  logger.start(`Deleting ${labels.length} label(s) from the repository.`);

  await Promise.all(
    labels.map(async (label) => {
      await api.delete(label.name, repo);
    }),
  );

  logger.success(`Deleted ${labels.length} label(s).`);
  return { success: true, metadata: { deleted: labels.length } };
};

const bulk = async (filePath: string, repo: string) => {
  logger.start(`Loading labels from ${filePath}.`);
  const labels = loadLabelsFromPath(filePath);
  const result = await upsertLabels(labels, repo);

  output.renderSummary("Label Bulk Create", [
    ["Created", result.created.length],
    ["Updated", result.updated.length],
    ["Unchanged", result.unchanged.length],
  ]);

  logger.success(`Applied ${labels.length} label(s).`);
  return { success: true, metadata: result };
};

const sync = async (sourceRepo: string, targetRepo: string) => {
  logger.start(`Syncing labels from ${sourceRepo} to ${targetRepo}.`);
  const response = await api.fetch(sourceRepo);
  const data = await response.json();
  const labels = data.map((label: Label) => normalizeLabel(label));
  const result = await upsertLabels(labels, targetRepo);

  output.renderSummary("Label Sync", [
    ["Source", sourceRepo],
    ["Target", targetRepo],
    ["Created", result.created.length],
    ["Updated", result.updated.length],
    ["Unchanged", result.unchanged.length],
  ]);

  logger.success(`Synced ${labels.length} label(s).`);
  return { success: true, metadata: result };
};

export default {
  get,
  ping,
  list,
  pull,
  push,
  prune,
  clone,
  bulk,
  sync,
  create,
  update,
  deleteLabel,
  pullTemplate,
  pushTemplate,
  upsertLabels,
  loadLabelsFromMetadata,
  loadLabelsFromTemplate,
};
