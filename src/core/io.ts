import fs from "fs";
import { ENCODING } from "@/core/constants";

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

export default { readJsonFile, writeJsonFile, fileExists, ensureDir };
