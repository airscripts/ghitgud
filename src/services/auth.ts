import git from "@/core/git";
import authApi from "@/api/auth";
import config from "@/core/config";
import output from "@/core/output";
import logger from "@/core/logger";
import outputState from "@/core/output-state";
import { GhitgudError, ConfigError } from "@/core/errors";

import {
  ERROR_AUTH_FAILED,
  ERROR_NO_REMOTE_URL,
  ERROR_AUTH_NO_TOKEN,
  INFO_AUTH_LOGGED_OUT,
  DEFAULT_PROFILE_NAME,
  ERROR_PROFILE_NOT_FOUND,
} from "@/core/constants";

import { execSync } from "child_process";

function maskToken(token: string): string {
  if (token.length <= 4) return "****";
  return `${token.substring(0, 4)}...`;
}

const login = async (token?: string, options?: { profile?: string }) => {
  const profileName = options?.profile ?? DEFAULT_PROFILE_NAME;
  const profiles = config.listProfiles();
  const hasExistingProfiles = profiles.length > 0;

  if (!token) {
    throw new GhitgudError(ERROR_AUTH_NO_TOKEN);
  }

  logger.start("Validating token.");

  let authStatus;
  try {
    authStatus = await authApi.fetchAuthenticatedUser(token);
  } catch {
    throw new GhitgudError(ERROR_AUTH_FAILED);
  }

  const { user, scopes } = authStatus;

  if (!hasExistingProfiles) {
    config.addProfile(profileName, { token });
  } else {
    const profile = config.getProfile(profileName);

    if (profile) {
      config.write("token", token);
    } else {
      config.addProfile(profileName, { token });
    }
  }

  if (hasExistingProfiles) {
    config.setActiveProfile(profileName);
  }

  logger.success(
    `Logged in as ${user.login}${user.name ? ` (${user.name})` : ""}.`,
  );

  if (scopes.length > 0) {
    output.renderSection("Token scopes:");
    output.renderList(scopes);
  }

  return {
    user,
    scopes,
    success: true,
    profile: profileName,
  };
};

const logout = () => {
  const token = config.getTokenOptional();
  if (!token) {
    throw new GhitgudError(ERROR_AUTH_NO_TOKEN);
  }

  logger.start("Removing stored token.");
  config.unset("token");
  logger.success(INFO_AUTH_LOGGED_OUT);
  return { success: true };
};

const status = async (showToken = false) => {
  const token = config.getTokenOptional();
  if (!token) {
    throw new GhitgudError(ERROR_AUTH_NO_TOKEN);
  }

  logger.start("Checking authentication status.");

  let authStatus;
  try {
    authStatus = await authApi.fetchAuthenticatedUser();
  } catch {
    throw new GhitgudError(ERROR_AUTH_FAILED);
  }

  const { user, scopes } = authStatus;
  const profiles = config.listProfiles();
  const activeProfile = profiles.find((p) => p.active)?.name ?? null;

  const entries: [string, string][] = [
    ["User", user.login],
    ["Name", user.name ?? "(not set)"],
    ["Profile", activeProfile ?? DEFAULT_PROFILE_NAME],
    ["Scopes", scopes.length > 0 ? scopes.join(", ") : "(not available)"],
  ];

  if (showToken) {
    entries.push(["Token", token]);
  }

  output.renderSummary("Authentication", entries);

  return { success: true, user, scopes, profile: activeProfile };
};

const token = (raw: boolean) => {
  const currentToken = config.getTokenOptional();
  if (!currentToken) {
    throw new GhitgudError(ERROR_AUTH_NO_TOKEN);
  }

  const displayed = raw ? currentToken : maskToken(currentToken);

  if (outputState.isHumanOutput()) {
    console.log(displayed);
  }

  return { success: true, token: currentToken, masked: displayed };
};

const list = () => {
  const profiles = config.listProfiles();

  output.renderTable(
    profiles.map((profile) => ({
      profile: profile.name,
      active: profile.active ? "yes" : "no",
      token: profile.hasToken ? "configured" : "missing",
    })),

    { emptyMessage: "No profiles configured." },
  );

  return { success: true, profiles };
};

const switchProfile = async (name: string) => {
  if (!name.trim()) {
    throw new ConfigError("Profile name is required.");
  }

  const profile = config.getProfile(name);
  if (!profile) {
    throw new ConfigError(ERROR_PROFILE_NOT_FOUND);
  }

  if (!profile.token) {
    throw new ConfigError("Token is required.");
  }

  logger.start(`Validating token for profile "${name}".`);
  await authApi.fetchAuthenticatedUser(profile.token);
  config.setActiveProfile(name);
  logger.success(`Active profile switched to "${name}".`);
  return { success: true, profile: name };
};

const detect = () => {
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
  const profileName = DEFAULT_PROFILE_NAME;

  logger.start("Detecting the best profile for the current repository.");
  config.setRepoLocalProfile(profileName);

  if (repo) {
    logger.success(`Using profile "${profileName}" for ${repo}.`);
  } else {
    logger.warn("No git remote found. Using default profile.");
  }

  return {
    success: true,
    repository: repo,
    profile: profileName,
  };
};

const setupGit = () => {
  logger.start("Configuring git credential helper.");

  try {
    const ghgPath = process.argv[1] || "ghg";
    const credentialHelper = `!${ghgPath} auth token`;

    execSync(`git config --global credential.helper "${credentialHelper}"`, {
      encoding: "utf8",
    });

    logger.success("Git credential helper configured.");
    logger.info("Git will now use ghg for HTTPS authentication.");
  } catch {
    throw new GhitgudError(
      "Failed to configure git credential helper. Ensure git is installed.",
    );
  }

  return { success: true };
};

export default {
  list,
  login,
  token,
  logout,
  status,
  detect,
  setupGit,
  switch: switchProfile,
};
