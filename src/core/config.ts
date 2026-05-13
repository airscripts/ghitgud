import fs from "fs";
import "dotenv/config";
import process from "process";
import { ConfigError } from "@/core/errors";

import {
  ENCODING,
  ERROR_NO_REPO,
  GHITGUD_FOLDER,
  ERROR_NO_TOKEN,
  CREDENTIALS_PATH,
} from "@/core/constants";
import profileService from "@/services/profile";

function readCredentialsFile(): Record<string, string> | null {
  if (!fs.existsSync(CREDENTIALS_PATH)) return null;
  const data = fs.readFileSync(CREDENTIALS_PATH, ENCODING);
  return JSON.parse(data);
}

function resolve(key: string, envVar: string): string {
  const envValue = process.env[envVar];
  if (envValue) return envValue;

  const credentials = readCredentialsFile();
  if (credentials && credentials[key]) return credentials[key];

  const active = profileService.getActiveProfile();
  if (active) {
    if (key === "token") return active.token;
    if (key === "repo" && active.repo) return active.repo;
  }

  throw new ConfigError(key === "repo" ? ERROR_NO_REPO : ERROR_NO_TOKEN);
}

function read(key: string): string | null {
  const credentials = readCredentialsFile();
  if (credentials && credentials[key]) return credentials[key];

  const active = profileService.getActiveProfile();
  if (active) {
    if (key === "token") return active.token;
    if (key === "repo" && active.repo) return active.repo;
  }

  return null;
}

function has(key: string): boolean {
  const isEnvVarSet =
    !!process.env[
      key === "repo" ? "GHITGUD_GITHUB_REPO" : "GHITGUD_GITHUB_TOKEN"
    ];

  if (isEnvVarSet) {
    return true;
  }

  const credentials = readCredentialsFile();
  if (credentials?.[key]) {
    return true;
  }

  const active = profileService.getActiveProfile();
  if (active) {
    if (key === "token") return true;
    if (key === "repo" && active.repo) return true;
  }

  return false;
}

function write(key: string, value: string): void {
  let credentials: Record<string, string> = {};

  if (fs.existsSync(CREDENTIALS_PATH)) {
    const data = fs.readFileSync(CREDENTIALS_PATH, ENCODING);
    credentials = JSON.parse(data);
  } else {
    fs.mkdirSync(GHITGUD_FOLDER, { recursive: true });
  }

  credentials[key] = value;
  fs.writeFileSync(
    CREDENTIALS_PATH,
    JSON.stringify(credentials, null, 2),
    ENCODING,
  );
}

function getRepo(): string {
  return resolve("repo", "GHITGUD_GITHUB_REPO");
}

function getToken(): string {
  return resolve("token", "GHITGUD_GITHUB_TOKEN");
}

const config = {
  getRepo,
  getToken,
  read,
  write,
  has,
};

export default config;
