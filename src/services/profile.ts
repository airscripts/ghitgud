import fs from "fs";
import { execSync } from "child_process";
import path from "path";

import logger from "@/core/logger";
import { GhitgudError } from "@/core/errors";

import {
  ENCODING,
  GHITGUD_FOLDER,
  PROFILES_FILE,
  CREDENTIALS_PATH,
} from "@/core/constants";

export interface Profile {
  token: string;
  repo?: string;
  createdAt: string;
}

export interface ProfilesData {
  profiles: Record<string, Profile>;
  active: string | null;
}

const PROFILES_PATH = path.join(GHITGUD_FOLDER, PROFILES_FILE);

function ensureProfilesDir(): void {
  if (!fs.existsSync(GHITGUD_FOLDER)) {
    fs.mkdirSync(GHITGUD_FOLDER, { recursive: true });
  }
}

function loadProfiles(): ProfilesData {
  if (!fs.existsSync(PROFILES_PATH)) {
    return { profiles: {}, active: null };
  }

  const data = fs.readFileSync(PROFILES_PATH, ENCODING);
  const parsed = JSON.parse(data);

  return {
    profiles: parsed.profiles || {},
    active: parsed.active || null,
  };
}

function saveProfiles(data: ProfilesData): void {
  ensureProfilesDir();
  fs.writeFileSync(
    PROFILES_PATH,
    JSON.stringify(data, null, 2),
    ENCODING,
  );
}

function writeCredentials(token: string, repo?: string): void {
  ensureProfilesDir();
  const credentials: Record<string, string> = {};
  credentials.token = token;
  if (repo) credentials.repo = repo;

  fs.writeFileSync(
    CREDENTIALS_PATH,
    JSON.stringify(credentials, null, 2),
    ENCODING,
  );
}

function list() {
  const data = loadProfiles();
  const names = Object.keys(data.profiles);

  if (names.length === 0) {
    logger.info("No profiles configured.");
    return { success: true, profiles: [] };
  }

  console.log();
  const rows = names.map((name) => ({
    name,
    active: data.active === name ? "*" : "",
    repo: data.profiles[name].repo || "(not set)",
    createdAt: data.profiles[name].createdAt,
  }));

  console.table(rows);
  return { success: true, profiles: data.profiles, active: data.active };
}

function add(name: string, token: string, repo?: string) {
  const data = loadProfiles();

  if (data.profiles[name]) {
    throw new GhitgudError(`Profile "${name}" already exists.`);
  }

  data.profiles[name] = {
    token,
    repo,
    createdAt: new Date().toISOString(),
  };

  if (!data.active) {
    data.active = name;
    writeCredentials(token, repo);
    logger.success(`Profile "${name}" added and activated.`);
  } else {
    logger.success(`Profile "${name}" added.`);
  }

  saveProfiles(data);
  return { success: true };
}

function remove(name: string) {
  const data = loadProfiles();

  if (!data.profiles[name]) {
    throw new GhitgudError(`Profile "${name}" does not exist.`);
  }

  delete data.profiles[name];

  if (data.active === name) {
    data.active = null;
    const remaining = Object.keys(data.profiles);

    if (remaining.length > 0) {
      data.active = remaining[0];
      const next = data.profiles[remaining[0]];
      writeCredentials(next.token, next.repo);
      logger.success(
        `Profile "${name}" removed. Switched to "${remaining[0]}".`,
      );
    } else {
      if (fs.existsSync(CREDENTIALS_PATH)) {
        fs.unlinkSync(CREDENTIALS_PATH);
      }
      logger.success(`Profile "${name}" removed. No active profile set.`);
    }
  } else {
    logger.success(`Profile "${name}" removed.`);
  }

  saveProfiles(data);
  return { success: true };
}

function switchProfile(name: string) {
  const data = loadProfiles();

  if (!data.profiles[name]) {
    throw new GhitgudError(`Profile "${name}" does not exist.`);
  }

  data.active = name;
  const profile = data.profiles[name];
  writeCredentials(profile.token, profile.repo);
  saveProfiles(data);

  logger.success(`Switched to profile "${name}".`);
  return { success: true, profile };
}

function detect() {
  const data = loadProfiles();

  let remoteUrl: string;
  try {
    remoteUrl = execSync("git remote get-url origin", {
      encoding: ENCODING,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    throw new GhitgudError(
      "No git remote found. Run this inside a git repository.",
    );
  }

  if (!remoteUrl) {
    throw new GhitgudError("No git remote found.");
  }

  const match = remoteUrl.match(
    /github\.com[:/](.+?)\/(.+?)(?:\.git)?$/,
  );

  if (!match) {
    throw new GhitgudError("Remote does not point to GitHub.");
  }

  const owner = match[1];
  const repo = match[2];
  const fullRepo = `${owner}/${repo}`;

  const matching = Object.entries(data.profiles).find(([, profile]) => {
    return profile.repo === fullRepo;
  });

  if (matching) {
    logger.success(`Detected profile "${matching[0]}" for ${fullRepo}.`);
    return { success: true, profile: matching[0], repo: fullRepo };
  }

  logger.info(`No profile found for ${fullRepo}.`);
  return { success: true, profile: null, repo: fullRepo };
}

function getActiveProfile(): Profile | null {
  const data = loadProfiles();
  if (!data.active || !data.profiles[data.active]) return null;
  return data.profiles[data.active];
}

export default {
  list,
  add,
  remove,
  switchProfile,
  detect,
  getActiveProfile,
  loadProfiles,
  saveProfiles,
};
