import fs from "fs";
import "dotenv/config";
import path from "path";
import git from "@/core/git";
import process from "process";
import { ConfigError } from "@/core/errors";
import { CredentialsFile, Profile, ProfileRcFile } from "@/types";

import {
  ENCODING,
  ERROR_NO_REPO,
  ERROR_NO_TOKEN,
  GHITGUD_FOLDER,
  GHITGUD_RC_FILE,
  CREDENTIALS_PATH,
  ERROR_NO_GIT_ROOT,
  GHITGUD_PROFILE_ENV,
  DEFAULT_PROFILE_NAME,
  ERROR_PROFILE_NOT_FOUND,
  ERROR_INVALID_PROFILE_RC,
  ERROR_INVALID_CREDENTIALS,
} from "@/core/constants";

interface NormalizedCredentials {
  activeProfile: string;
  profiles: Record<string, Profile>;
}

function parseJsonFile<T>(filePath: string, errorMessage: string): T {
  try {
    const data = fs.readFileSync(filePath, ENCODING);
    return JSON.parse(data) as T;
  } catch {
    throw new ConfigError(errorMessage);
  }
}

function readCredentialsFile(): CredentialsFile | null {
  if (!fs.existsSync(CREDENTIALS_PATH)) return null;
  return parseJsonFile<CredentialsFile>(
    CREDENTIALS_PATH,
    ERROR_INVALID_CREDENTIALS,
  );
}

function readRepoLocalConfig(): ProfileRcFile | null {
  try {
    const repoRoot = git.getRepoRoot();
    const rcPath = path.join(repoRoot, GHITGUD_RC_FILE);

    if (!fs.existsSync(rcPath)) return null;
    return parseJsonFile<ProfileRcFile>(rcPath, ERROR_INVALID_PROFILE_RC);
  } catch (error) {
    if (error instanceof ConfigError && error.message === ERROR_NO_GIT_ROOT) {
      return null;
    }

    if (error instanceof ConfigError) throw error;
    return null;
  }
}

function normalizeCredentials(
  credentials: CredentialsFile | null,
): NormalizedCredentials {
  if (!credentials) {
    return {
      activeProfile: DEFAULT_PROFILE_NAME,
      profiles: {},
    };
  }

  if (credentials.profiles) {
    return {
      activeProfile: credentials.activeProfile ?? DEFAULT_PROFILE_NAME,
      profiles: credentials.profiles,
    };
  }

  const legacyProfile: Profile = {
    repo: credentials.repo,
    token: credentials.token,
  };

  const hasLegacyData = legacyProfile.repo || legacyProfile.token;

  const profiles: Record<string, Profile> = hasLegacyData
    ? { [DEFAULT_PROFILE_NAME]: legacyProfile }
    : {};

  return {
    activeProfile: DEFAULT_PROFILE_NAME,
    profiles,
  };
}

function readCredentials(): NormalizedCredentials {
  return normalizeCredentials(readCredentialsFile());
}

function writeCredentials(credentials: NormalizedCredentials): void {
  fs.mkdirSync(GHITGUD_FOLDER, { recursive: true });

  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2), {
    encoding: ENCODING,
    mode: 0o600,
  });
}

function getProfileNames(credentials: NormalizedCredentials): string[] {
  return Object.keys(credentials.profiles);
}

function getStoredProfileName(
  credentials: NormalizedCredentials,
): string | null {
  if (
    credentials.activeProfile &&
    credentials.profiles[credentials.activeProfile]
  ) {
    return credentials.activeProfile;
  }

  if (credentials.profiles[DEFAULT_PROFILE_NAME]) {
    return DEFAULT_PROFILE_NAME;
  }

  const profileNames = getProfileNames(credentials);
  return profileNames[0] ?? null;
}

function getRepoLocalProfile(): string | null {
  const repoLocal = readRepoLocalConfig();
  const profile = repoLocal?.profile;
  if (!profile) return null;
  return profile;
}

function getResolvedProfileName(
  credentials: NormalizedCredentials,
): string | null {
  const envProfile = process.env[GHITGUD_PROFILE_ENV];
  if (envProfile) {
    if (!credentials.profiles[envProfile]) {
      throw new ConfigError(ERROR_PROFILE_NOT_FOUND);
    }

    return envProfile;
  }

  const repoLocalProfile = getRepoLocalProfile();
  if (repoLocalProfile && credentials.profiles[repoLocalProfile]) {
    return repoLocalProfile;
  }

  return getStoredProfileName(credentials);
}

function getWritableProfileName(credentials: NormalizedCredentials): string {
  const resolvedProfile = getResolvedProfileName(credentials);
  return resolvedProfile ?? DEFAULT_PROFILE_NAME;
}

function getProfile(
  name: string,
  credentials: NormalizedCredentials = readCredentials(),
): Profile | null {
  return credentials.profiles[name] ?? null;
}

function listProfiles() {
  const credentials = readCredentials();
  const activeProfile = getResolvedProfileName(credentials);

  return getProfileNames(credentials).map((name) => ({
    name,
    active: name === activeProfile,
    hasToken: !!credentials.profiles[name].token,
    repo: credentials.profiles[name].repo ?? null,
  }));
}

function addProfile(name: string, profile: Profile): void {
  const credentials = readCredentials();
  const nextCredentials: NormalizedCredentials = {
    activeProfile: credentials.activeProfile,
    profiles: {
      ...credentials.profiles,
      [name]: {
        ...credentials.profiles[name],
        ...profile,
      },
    },
  };

  if (!getProfileNames(credentials).length) {
    nextCredentials.activeProfile = name;
  }

  writeCredentials(nextCredentials);
}

function setActiveProfile(name: string): void {
  const credentials = readCredentials();
  if (!credentials.profiles[name]) {
    throw new ConfigError(ERROR_PROFILE_NOT_FOUND);
  }

  writeCredentials({
    activeProfile: name,
    profiles: credentials.profiles,
  });
}

function setRepoLocalProfile(name: string): void {
  const repoRoot = git.getRepoRoot();
  const rcPath = path.join(repoRoot, GHITGUD_RC_FILE);

  fs.writeFileSync(
    rcPath,
    JSON.stringify({ profile: name }, null, 2),
    ENCODING,
  );
}

function findProfileByRepo(repo: string): string | null {
  const normalizedRepo = repo.toLowerCase();
  const credentials = readCredentials();

  const profile = Object.entries(credentials.profiles).find(
    ([, value]) => value.repo?.toLowerCase() === normalizedRepo,
  );

  return profile?.[0] ?? null;
}

function read(key: string): string | null {
  const credentials = readCredentials();
  const profileName = getResolvedProfileName(credentials);
  if (!profileName) return null;

  const profile = getProfile(profileName, credentials);
  return profile?.[key as keyof Profile] ?? null;
}

function has(key: string): boolean {
  const envKey =
    key === "repo" ? "GHITGUD_GITHUB_REPO" : "GHITGUD_GITHUB_TOKEN";

  if (process.env[envKey]) return true;

  try {
    return read(key) !== null;
  } catch {
    return false;
  }
}

function write(key: string, value: string): void {
  const credentials = readCredentials();
  const profileName = getWritableProfileName(credentials);
  const profile = credentials.profiles[profileName] ?? {};

  writeCredentials({
    activeProfile: credentials.activeProfile || profileName,
    profiles: {
      ...credentials.profiles,
      [profileName]: {
        ...profile,
        [key]: value,
      },
    },
  });
}

function unset(key: string): void {
  const credentials = readCredentials();
  const profileName = getWritableProfileName(credentials);
  const profile = credentials.profiles[profileName] ?? {};

  const { [key]: _removed, ...restProfile } = profile as Record<string, string>;
  void _removed;

  writeCredentials({
    activeProfile: credentials.activeProfile || profileName,
    profiles: {
      ...credentials.profiles,
      [profileName]: restProfile as Profile,
    },
  });
}

function getRepo(): string {
  const repo = getRepoOptional();
  if (repo) return repo;

  throw new ConfigError(ERROR_NO_REPO);
}

function getRepoOptional(): string | null {
  const repo = process.env.GHITGUD_GITHUB_REPO;
  if (repo) return repo;

  const value = read("repo");
  if (value) return value;

  return null;
}

function getToken(): string {
  const token = getTokenOptional();
  if (token) return token;

  throw new ConfigError(ERROR_NO_TOKEN);
}

function getTokenOptional(): string | null {
  const token = process.env.GHITGUD_GITHUB_TOKEN;
  if (token) return token;

  const value = read("token");
  if (value) return value;

  return null;
}

const config = {
  has,
  read,
  write,
  unset,
  getRepo,
  getToken,
  getProfile,
  addProfile,
  listProfiles,
  getRepoOptional,
  getTokenOptional,
  setActiveProfile,
  findProfileByRepo,
  getRepoLocalProfile,
  setRepoLocalProfile,
};

export default config;
