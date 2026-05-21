import git from "@/core/git";
import client from "@/api/client";
import config from "@/core/config";
import logger from "@/core/logger";
import { ConfigError } from "@/core/errors";

import {
  ERROR_NO_REMOTE_URL,
  DEFAULT_PROFILE_NAME,
  ERROR_PROFILE_NOT_FOUND,
  ERROR_PROFILE_NAME_REQUIRED,
  ERROR_PROFILE_TOKEN_REQUIRED,
} from "@/core/constants";

interface AddProfileOptions {
  repo?: string;
  token?: string;
}

function validateName(name: string): string {
  if (!name.trim()) {
    throw new ConfigError(ERROR_PROFILE_NAME_REQUIRED);
  }

  return name;
}

function add(name: string, options: AddProfileOptions) {
  const profileName = validateName(name);
  if (!options.token) throw new ConfigError(ERROR_PROFILE_TOKEN_REQUIRED);

  config.addProfile(profileName, {
    repo: options.repo,
    token: options.token,
  });

  logger.success(`Profile "${profileName}" added successfully.`);
  return { success: true, profile: profileName };
}

function list() {
  const profiles = config.listProfiles();

  if (!profiles.length) {
    logger.info("No profiles configured.");
  } else {
    profiles.forEach((profile) => {
      const marker = profile.active ? "*" : " ";
      const repo = profile.repo ?? "(no repo)";
      const token = profile.hasToken ? "token" : "no token";
      logger.info(`${marker} ${profile.name} - ${repo} - ${token}`);
    });
  }

  return { success: true, profiles };
}

async function switchProfile(name: string) {
  const profileName = validateName(name);
  const profile = config.getProfile(profileName);

  if (!profile) {
    throw new ConfigError(ERROR_PROFILE_NOT_FOUND);
  }

  if (!profile.token) {
    throw new ConfigError(ERROR_PROFILE_TOKEN_REQUIRED);
  }

  await client.validateToken(profile.token);
  config.setActiveProfile(profileName);
  logger.success(`Active profile switched to "${profileName}".`);
  return { success: true, profile: profileName };
}

function detect() {
  let remoteUrl: string | null = null;

  try {
    remoteUrl = git.getRemoteUrl();
  } catch (error) {
    if (
      !(error instanceof ConfigError) ||
      error.message !== ERROR_NO_REMOTE_URL
    ) {
      throw error;
    }
  }

  const repo = remoteUrl ? git.parseRepoFromRemoteUrl(remoteUrl) : null;
  const detectedProfile = repo ? config.findProfileByRepo(repo) : null;
  const profileName = detectedProfile ?? DEFAULT_PROFILE_NAME;

  config.setRepoLocalProfile(profileName);

  if (detectedProfile) {
    logger.success(`Detected profile "${profileName}" for ${repo}.`);
  } else {
    logger.warn(
      `No matching profile found for ${repo ?? "the current remote"}. Falling back to "${DEFAULT_PROFILE_NAME}".`,
    );
  }

  return {
    success: true,
    repository: repo,
    profile: profileName,
    fallback: !detectedProfile,
  };
}

export default {
  add,
  list,
  detect,
  switch: switchProfile,
};
