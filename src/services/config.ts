import config from "@/core/config";
import output from "@/core/output";
import logger from "@/core/logger";
import { ConfigError } from "@/core/errors";
import type { SupportedKey } from "@/core/constants";

import { ERROR_UNSUPPORTED_KEY, SUPPORTED_CONFIG_KEYS } from "@/core/constants";

const validateKey = (key: string): SupportedKey => {
  if (!SUPPORTED_CONFIG_KEYS.includes(key as SupportedKey)) {
    throw new ConfigError(ERROR_UNSUPPORTED_KEY);
  }

  return key as SupportedKey;
};

const set = (key: string, value: string) => {
  validateKey(key);
  logger.start(`Saving config "${key}".`);
  config.write(key, value);
  logger.success(`Config "${key}" set successfully.`);
  return { success: true };
};

const get = (key: string) => {
  validateKey(key);
  const value = config.read(key);
  output.renderSummary("Configuration", [[key, value ?? "(not set)"]]);
  return { success: true, key, value: value || null };
};

const unset = (key: string) => {
  validateKey(key);
  const oldValue = config.read(key);

  if (!oldValue) {
    throw new ConfigError(`Config "${key}" is not set.`);
  }

  logger.start(`Removing config "${key}".`);
  config.unset(key);
  logger.success(`Config "${key}" unset successfully.`);
  return { success: true };
};

export default { set, get, unset, read: config.read };
