import fs from "fs";
import path from "path";

import io from "@/core/io";
import api from "@/api/cache";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import artifactsApi from "@/api/artifacts";
import workflowsApi from "@/api/workflows";
import { ActionsCacheEntry } from "@/types";
import { GitfleetError } from "@/core/errors";
import { DEFAULT_OUTPUT_DIR, INFO_CACHE_METADATA_ONLY } from "@/core/constants";

interface CacheListResponse {
  actions_caches?: CacheApiEntry[];
}

interface CacheApiEntry {
  id: number;
  key: string;
  ref: string;
  version: string;
  created_at: string;
  size_in_bytes: number;
  last_accessed_at: string;
}

function normalize(entry: CacheApiEntry): ActionsCacheEntry {
  return {
    id: entry.id,
    key: entry.key,
    ref: entry.ref,
    version: entry.version,
    createdAt: entry.created_at,
    sizeInBytes: entry.size_in_bytes,
    lastAccessedAt: entry.last_accessed_at,
  };
}

const inspect = async (key: string, repo?: string) => {
  logger.start(`Inspecting cache entries matching "${key}".`);
  const targetRepo = await repoResolver.resolveRepo(repo);
  const response = await api.listCaches(targetRepo, key);
  const data = (await response.json()) as CacheListResponse;
  const entries = (data.actions_caches ?? []).map(normalize);

  output.renderTable(
    entries.map((entry) => ({
      key: entry.key,
      ref: entry.ref,
      size: entry.sizeInBytes,
      createdAt: entry.createdAt,
      lastAccessedAt: entry.lastAccessedAt,
    })),

    { emptyMessage: "No matching caches were found." },
  );

  if (entries.length) {
    logger.warn(INFO_CACHE_METADATA_ONLY);
  }

  logger.success("Cache inspection complete.");
  return { success: true, repo: targetRepo, metadata: entries };
};

const list = async (options: {
  repo?: string;
  key?: string;
  limit?: number;
}) => {
  const limit = options.limit ?? 30;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new GitfleetError("Cache limit must be between 1 and 100.");
  }

  const targetRepo = await repoResolver.resolveRepo(options.repo);
  const response = await api.listCaches(targetRepo, options.key, limit);
  const data = (await response.json()) as CacheListResponse;
  const entries = (data.actions_caches ?? []).map(normalize);

  output.renderTable(
    entries.map((entry) => ({
      id: entry.id,
      key: entry.key,
      ref: entry.ref,
      size: entry.sizeInBytes,
      lastAccessedAt: entry.lastAccessedAt,
    })),
    { emptyMessage: "No caches found." },
  );

  logger.success(`Loaded ${entries.length} caches.`);
  return { success: true, repo: targetRepo, caches: entries };
};

const remove = async (
  key: string,
  options: { repo?: string; all?: boolean },
) => {
  const targetRepo = await repoResolver.resolveRepo(options.repo);
  const matches: ActionsCacheEntry[] = [];
  let page = 1;

  while (true) {
    const response = await api.listCaches(targetRepo, key, 100, page);
    const data = (await response.json()) as CacheListResponse;
    const entries = data.actions_caches ?? [];
    matches.push(...entries.map(normalize));
    if (entries.length < 100) break;
    page += 1;
  }
  const selected = options.all
    ? matches
    : matches.filter((entry) => entry.key === key);

  if (!selected.length) {
    throw new GitfleetError(`No cache found for key "${key}".`);
  }

  if (!options.all && selected.length > 1) {
    throw new GitfleetError(
      `Multiple caches use key "${key}". Re-run with --all to delete every match.`,
    );
  }

  await Promise.all(
    selected.map((entry) => api.deleteCache(targetRepo, entry.id)),
  );
  logger.success(`Deleted ${selected.length} cache entries.`);
  return {
    success: true,
    repo: targetRepo,
    deleted: selected.map((entry) => ({ id: entry.id, key: entry.key })),
  };
};

const download = async (
  key: string,
  options: { repo?: string; outputDir?: string },
) => {
  logger.start(`Preparing cache debug bundle for "${key}".`);
  const targetRepo = await repoResolver.resolveRepo(options.repo);
  const cacheRes = await api.listCaches(targetRepo, key);
  const cacheData = (await cacheRes.json()) as CacheListResponse;
  const entries = (cacheData.actions_caches ?? []).map(normalize);

  if (!entries.length) {
    throw new GitfleetError("No cache entry found for the provided key.");
  }

  const outputDir = path.resolve(options.outputDir ?? DEFAULT_OUTPUT_DIR);
  fs.mkdirSync(outputDir, { recursive: true });

  const metadataPath = path.join(
    outputDir,
    `cache-${io.safeFilename(key, "cache")}.json`,
  );

  fs.writeFileSync(metadataPath, JSON.stringify(entries, null, 2), "utf8");
  const runRes = await workflowsApi
    .getRun(targetRepo, entries[0].id)
    .catch(() => null);

  if (runRes) {
    const logs = await workflowsApi.downloadRunLogs(targetRepo, entries[0].id);
    const buffer = Buffer.from(await logs.arrayBuffer());
    const logsPath = path.join(outputDir, `run-${entries[0].id}-logs.zip`);
    fs.writeFileSync(logsPath, buffer);
  }

  const artifacts = await artifactsApi
    .listRunArtifacts(targetRepo, entries[0].id)
    .catch(() => null);

  if (artifacts) {
    const payload = (await artifacts.json()) as {
      artifacts?: Array<{ id: number; name: string }>;
    };

    for (const artifact of payload.artifacts ?? []) {
      const artifactResponse = await artifactsApi.downloadArtifact(
        targetRepo,
        artifact.id,
      );

      const artifactPath = path.join(
        outputDir,
        `${io.safeFilename(artifact.name, `artifact-${artifact.id}`)}.zip`,
      );

      fs.writeFileSync(
        artifactPath,
        Buffer.from(await artifactResponse.arrayBuffer()),
      );
    }
  }

  logger.warn(INFO_CACHE_METADATA_ONLY);
  logger.success(`Cache debug bundle written to ${outputDir}.`);

  return {
    key,
    entries,
    outputDir,
    metadataPath,
    success: true,
    repo: targetRepo,
  };
};

export default {
  list,
  remove,
  inspect,
  download,
};
