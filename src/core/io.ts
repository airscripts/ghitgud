import fs from "fs";
import path from "path";

import { ENCODING } from "@/core/constants";
import { GhitgudError } from "@/core/errors";

const readJsonFile = <T>(filePath: string): T => {
  const data = fs.readFileSync(filePath, ENCODING);
  return JSON.parse(data) as T;
};

const writeJsonFile = (filePath: string, data: unknown): void => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), ENCODING);
};

const fileExists = (filePath: string): boolean => {
  return fs.existsSync(filePath);
};

const ensureDir = (dirPath: string): void => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const resolveInsideRoot = (root: string, relativePath: string): string => {
  if (path.isAbsolute(relativePath)) {
    throw new GhitgudError(`Path must be relative: ${relativePath}`);
  }

  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolvedPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new GhitgudError(`Path escapes repository root: ${relativePath}`);
  }

  return resolvedPath;
};

const safeFilename = (value: string, fallback: string): string => {
  const sanitized = value.replace(/[^\w.-]/g, "_").replace(/^_+|_+$/g, "");
  return sanitized || fallback;
};

const readDir = (dirPath: string): string[] => {
  return fs.readdirSync(dirPath);
};

const isDirectory = (dirPath: string): boolean => {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
};

const removeDir = (dirPath: string): void => {
  fs.rmSync(dirPath, { recursive: true, force: true });
};

const writeFile = (filePath: string, content: string): void => {
  fs.writeFileSync(filePath, content, ENCODING);
};

export default {
  ensureDir,
  fileExists,
  safeFilename,
  readJsonFile,
  writeJsonFile,
  resolveInsideRoot,
  readDir,
  isDirectory,
  removeDir,
  writeFile,
};
