import fs from "fs";
import path from "path";

import api, { GistInput } from "@/api/gists";
import client from "@/api/client";
import git from "@/core/git";
import output from "@/core/output";
import logger from "@/core/logger";
import outputState from "@/core/output-state";
import { GitfleetError } from "@/core/errors";
import { GistFile, GistSummary } from "@/types";

interface GistApiFile {
  filename?: string;
  type?: string | null;
  language?: string | null;
  raw_url?: string;
  size?: number;
  content?: string;
  truncated?: boolean;
}

interface GistApiEntry {
  id: string;
  description?: string | null;
  public: boolean;
  html_url: string;
  git_pull_url: string;
  created_at: string;
  updated_at: string;
  owner?: { login?: string } | null;
  files?: Record<string, GistApiFile>;
}

const normalize = (gist: GistApiEntry): GistSummary => ({
  id: gist.id,
  public: gist.public,
  htmlUrl: gist.html_url,
  gitPullUrl: gist.git_pull_url,
  createdAt: gist.created_at,
  updatedAt: gist.updated_at,
  description: gist.description ?? null,
  owner: gist.owner?.login ?? null,
  files: Object.entries(gist.files ?? {}).map(
    ([name, file]): GistFile => ({
      filename: file.filename ?? name,
      type: file.type ?? null,
      language: file.language ?? null,
      rawUrl: file.raw_url ?? "",
      size: file.size ?? 0,
      content: file.content,
      truncated: file.truncated,
    }),
  ),
});

const readFiles = (files: string[]): Record<string, { content: string }> => {
  const result: Record<string, { content: string }> = {};

  for (const file of files) {
    const absolutePath = path.resolve(file);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      throw new GitfleetError(`Gist file not found: ${file}.`);
    }

    const name = path.basename(file);
    if (name in result) {
      throw new GitfleetError(`Duplicate gist filename: ${name}.`);
    }

    const content = fs.readFileSync(absolutePath, "utf8");
    if (content.includes("\uFFFD")) {
      throw new GitfleetError(`Gist file must contain valid UTF-8: ${file}.`);
    }
    result[name] = { content };
  }

  return result;
};

const list = async (options: { public?: boolean; limit?: number } = {}) => {
  const limit = options.limit ?? 30;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new GitfleetError("Gist limit must be between 1 and 100.");
  }

  const response = await api.list(options.public ?? false, limit);
  const gists = ((await response.json()) as GistApiEntry[]).map(normalize);
  output.renderTable(
    gists.map((gist) => ({
      id: gist.id,
      owner: gist.owner ?? "-",
      files: gist.files.map((file) => file.filename).join(", "),
      visibility: gist.public ? "public" : "secret",
      description: gist.description ?? "-",
    })),
    { emptyMessage: "No gists found." },
  );
  logger.success(`Loaded ${gists.length} gists.`);
  return { success: true, gists };
};

const getGist = async (id: string): Promise<GistSummary> => {
  const response = await api.get(id);
  return normalize((await response.json()) as GistApiEntry);
};

const view = async (
  id: string,
  options: { raw?: boolean; file?: string } = {},
) => {
  if (options.raw && outputState.isJsonOutput()) {
    throw new GitfleetError("--raw cannot be combined with --json.");
  }

  const gist = await getGist(id);
  if (options.raw) {
    if (gist.files.length !== 1 && !options.file) {
      throw new GitfleetError(
        `Multiple files found. Use --file with one of: ${gist.files.map((file) => file.filename).join(", ")}.`,
      );
    }

    const file = options.file
      ? gist.files.find((candidate) => candidate.filename === options.file)
      : gist.files[0];
    if (!file) throw new GitfleetError(`Gist file not found: ${options.file}.`);

    let content = file.content;
    if (file.truncated || content === undefined) {
      if (!file.rawUrl) throw new GitfleetError("Gist raw URL is unavailable.");
      const response = await client.getUrlTokenRequiredWithAccept(
        file.rawUrl,
        "text/plain",
      );
      content = await response.text();
    }
    process.stdout.write(content);
  } else {
    output.renderKeyValues([
      ["ID", gist.id],
      ["Owner", gist.owner ?? "-"],
      ["Visibility", gist.public ? "public" : "secret"],
      ["Description", gist.description ?? "-"],
      ["URL", gist.htmlUrl],
    ]);
    output.renderTable(
      gist.files.map((file) => ({
        file: file.filename,
        language: file.language ?? "-",
        type: file.type ?? "-",
        size: file.size,
      })),
    );
  }

  return { success: true, gist };
};

const create = async (
  files: string[],
  options: { description?: string; public?: boolean },
) => {
  const input: GistInput = {
    files: readFiles(files),
    description: options.description,
    public: options.public ?? false,
  };
  const response = await api.create(input);
  const gist = normalize((await response.json()) as GistApiEntry);
  logger.success(`Created gist ${gist.id}.`);
  return { success: true, gist };
};

const edit = async (
  id: string,
  options: { add?: string[]; remove?: string[] },
) => {
  const additions = readFiles(options.add ?? []);
  const removals = options.remove ?? [];
  if (!Object.keys(additions).length && !removals.length) {
    throw new GitfleetError("At least one gist file change is required.");
  }

  const files: GistInput["files"] = { ...additions };
  for (const name of removals) {
    if (name in files) {
      throw new GitfleetError(`Cannot add and remove gist file: ${name}.`);
    }
    files[name] = null;
  }

  const response = await api.update(id, { files });
  const gist = normalize((await response.json()) as GistApiEntry);
  logger.success(`Updated gist ${id}.`);
  return { success: true, gist };
};

const remove = async (id: string) => {
  await api.remove(id);
  logger.success(`Deleted gist ${id}.`);
  return { success: true, gist: id };
};

const clone = async (id: string, directory?: string) => {
  const gist = await getGist(id);
  const destination = path.resolve(directory ?? id);
  if (fs.existsSync(destination)) {
    throw new GitfleetError(
      `Clone destination already exists: ${destination}.`,
    );
  }
  git.cloneRepository(gist.gitPullUrl, { directory: destination });
  logger.success(`Cloned gist ${id} to ${destination}.`);
  return { success: true, gist: id, directory: destination };
};

const fork = async (id: string) => {
  logger.start(`Forking gist ${id}.`);
  const response = await api.fork(id);
  const gist = normalize((await response.json()) as GistApiEntry);
  logger.success(`Forked gist ${id} to ${gist.id}.`);
  return { success: true, gist };
};

const star = async (id: string) => {
  logger.start(`Starring gist ${id}.`);
  await api.star(id);
  logger.success(`Starred gist ${id}.`);
  return { success: true, gist: id };
};

const unstar = async (id: string) => {
  logger.start(`Unstarring gist ${id}.`);
  await api.unstar(id);
  logger.success(`Unstarred gist ${id}.`);
  return { success: true, gist: id };
};

const comment = async (id: string, body: string) => {
  if (!body) throw new GitfleetError("Comment body is required.");
  logger.start(`Commenting on gist ${id}.`);
  const response = await api.createComment(id, body);
  const result = (await response.json()) as {
    id: number;
    body: string;
    created_at: string;
  };
  logger.success(`Commented on gist ${id}.`);
  return { success: true, comment: result };
};

const deleteComment = async (gistId: string, commentId: number) => {
  logger.start(`Deleting comment ${commentId} on gist ${gistId}.`);
  await api.deleteComment(gistId, commentId);
  logger.success(`Deleted comment ${commentId}.`);
  return { success: true, comment: commentId };
};

export default {
  list,
  view,
  create,
  edit,
  remove,
  clone,
  fork,
  star,
  unstar,
  comment,
  deleteComment,
};
