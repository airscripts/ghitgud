import os from "os";
import path from "path";

export const GHITGUD_FOLDER = path.join(os.homedir(), ".config", "ghitgud");
export const CREDENTIALS_FILE = "credentials.json";
export const METADATA_FILE = "labels.json";
export const ENCODING = "utf8";

export const CREDENTIALS_PATH = path.join(GHITGUD_FOLDER, CREDENTIALS_FILE);
export const METADATA_FILE_PATH = path.join(GHITGUD_FOLDER, METADATA_FILE);
export const TEMPLATES_DIR = path.join(__dirname, "templates");

export const GITHUB_API_VERSION = "2022-11-28";
export const GITHUB_API_BASE_URL = "https://api.github.com";
export const GITHUB_API_ACCEPT = "application/vnd.github+json";

export const STATUS_OK_MIN = 200;
export const STATUS_OK_MAX = 299;
export const STATUS_UNAUTHORIZED = 401;
export const STATUS_NOT_FOUND = 404;
export const STATUS_UNPROCESSABLE = 422;

export const ERROR_UNAUTHORIZED = "Unauthorized.";
export const ERROR_NOT_FOUND = "Resource not found.";
export const ERROR_UNPROCESSABLE = "Content is unprocessable.";
export const ERROR_UNEXPECTED = "Unexpected status code.";
export const ERROR_NO_REPO =
  "Repository not configured. Set it with: ghitgud config set repo owner/repo.";
export const ERROR_NO_TOKEN =
  "Token not configured. Set it with: ghitgud config set token <your-token>.";
export const ERROR_UNSUPPORTED_KEY = "Trying to set unsupported key.";
export const ERROR_NO_METADATA = "No metadata file found.";
export const INFO_NO_NOTIFICATIONS = "No notifications found.";

export const PING_RESPONSE = "pong";

export const SUPPORTED_CONFIG_KEYS = ["token", "repo"] as const;
export type SupportedKey = (typeof SUPPORTED_CONFIG_KEYS)[number];
