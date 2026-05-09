import config from "@/core/config";
import format from "@/core/format";
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
  config.write(key, value);
  const result = { success: true };
  format.formatOutput(result);
  return result;
};

const get = (key: string) => {
  validateKey(key);
  const value = config.read(key);
  const result = { success: true, key, value: value || null };
  format.formatOutput(result);
  return result;
};

export default { set, get };