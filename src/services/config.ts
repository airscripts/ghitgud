import config from "@/core/config";
import logger from "@/core/logger";
import { ConfigError } from "@/core/errors";
import type { SupportedKey } from "@/core/constants";

import {
  ERROR_UNSUPPORTED_KEY,
  SUPPORTED_CONFIG_KEYS,
} from "@/core/constants";

const validateKey = (key: string): SupportedKey => {
  if (!SUPPORTED_CONFIG_KEYS.includes(key as SupportedKey)) {
    throw new ConfigError(ERROR_UNSUPPORTED_KEY);
  }
  return key as SupportedKey;
};

const set = (key: string, value: string) => {
  validateKey(key);
  logger.info(`Setting config "${key}".`);
  config.write(key, value);
  logger.success(`Config "${key}" set successfully.`);
  return { success: true };
};

const get = (key: string) => {
  validateKey(key);
  const value = config.read(key);
  logger.info(`${key}: ${value ?? "(not set)"}.`);
  return { success: true, key, value: value || null };
};

export default { set, get };