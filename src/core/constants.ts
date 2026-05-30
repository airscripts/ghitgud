import os from "os";
import path from "path";

export const GHITGUD_FOLDER = path.join(os.homedir(), ".config", "ghitgud");
export const CREDENTIALS_FILE = "credentials.json";
export const METADATA_FILE = "labels.json";
export const GHITGUD_RC_FILE = ".ghitgudrc";
export const DEFAULT_PROFILE_NAME = "default";
export const ENCODING = "utf8";
export const GHITGUD_PROFILE_ENV = "GHITGUD_PROFILE";

export const CREDENTIALS_PATH = path.join(GHITGUD_FOLDER, CREDENTIALS_FILE);
export const METADATA_FILE_PATH = path.join(GHITGUD_FOLDER, METADATA_FILE);
export const TEMPLATES_DIR = path.join(__dirname, "templates");

export const GITHUB_API_VERSION = "2022-11-28";
export const GITHUB_API_BASE_URL = "https://api.github.com";
export const GITHUB_API_ACCEPT = "application/vnd.github+json";

export const STATUS_OK_MIN = 200;
export const STATUS_OK_MAX = 299;
export const STATUS_UNAUTHORIZED = 401;
export const STATUS_FORBIDDEN = 403;
export const STATUS_NOT_FOUND = 404;
export const STATUS_UNPROCESSABLE = 422;
export const STATUS_RATE_LIMITED = 429;

export const RATE_LIMIT_UNAUTHENTICATED = 60;
export const RATE_LIMIT_AUTHENTICATED = 5000;

export const ERROR_UNAUTHORIZED = "Unauthorized.";
export const ERROR_NOT_FOUND = "Resource not found.";
export const ERROR_UNPROCESSABLE = "Content is unprocessable.";
export const ERROR_UNEXPECTED = "Unexpected status code.";
export const ERROR_INVALID_CREDENTIALS = "Invalid credentials file.";
export const ERROR_INVALID_PROFILE_RC = "Invalid profile config file.";
export const ERROR_PROFILE_NOT_FOUND = "Profile not found.";
export const ERROR_PROFILE_NAME_REQUIRED = "Profile name is required.";
export const ERROR_PROFILE_TOKEN_REQUIRED = "Token is required.";
export const ERROR_NO_GIT_ROOT = "Git repository root not found.";
export const ERROR_NO_REMOTE_URL = "Unable to detect repository remote.";

export const ERROR_NO_REPO =
  "Repository not configured. Set it with: ghg config set repo owner/repo.";

export const ERROR_NO_TOKEN =
  "Token not configured. Set it with: ghg config set token <your-token>.";

export const ERROR_RATE_LIMIT_UNAUTHENTICATED = `Rate limit reached (60/hour). Set token for 5000/hour: ghg config set token <your-token>.`;
export const ERROR_RATE_LIMIT_AUTHENTICATED = "Rate limit reached.";
export const ERROR_TOKEN_REQUIRED = "This operation requires a token.";

export const ERROR_UNSUPPORTED_KEY = "Trying to set unsupported key.";
export const ERROR_NO_METADATA = "No metadata file found.";
export const ERROR_NO_REPO_TARGET = "No repository target provided.";

export const ERROR_MUTATION_REQUIRES_YES =
  "This operation changes repositories. Re-run with --yes to apply.";

export const ERROR_RULESET_REQUIRED = "Ruleset file is required.";

export const ERROR_LABEL_SOURCE_REQUIRED =
  "Either --template or --metadata must be provided.";

export const INFO_NO_NOTIFICATIONS = "No notifications found.";
export const DEFAULT_OUTPUT_DIR = ".ghitgud/actions";
export const WORKFLOW_DEFAULT_DIR = ".github/workflows";
export const WORKFLOW_FILE_EXTENSIONS = [".yml", ".yaml"] as const;

export const ERROR_WORKFLOW_NOT_FOUND =
  "No workflow files were found in .github/workflows.";

export const ERROR_WORKFLOW_INVALID_YAML =
  "Workflow file contains invalid YAML.";

export const ERROR_RUN_ID_REQUIRED = "Run id is required.";
export const ERROR_CACHE_KEY_REQUIRED = "Cache key is required.";

export const INFO_CACHE_METADATA_ONLY =
  "Cache metadata found, but cache byte download is not available through the official API.";

export const PING_RESPONSE = "pong";
export const DEFAULT_REPOS_RETIRE_MONTHS = 12;
export const DEFAULT_REPOS_REPORT_SINCE_DAYS = 30;
export const DEFAULT_PER_PAGE = 100;
export const README_LABEL = "README";
export const LICENSE_LABEL = "LICENSE";
export const SECURITY_LABEL = "SECURITY.md";
export const CODEOWNERS_LABEL = "CODEOWNERS";

export const CODEOWNERS_PATHS = [
  "CODEOWNERS",
  ".github/CODEOWNERS",
  "docs/CODEOWNERS",
] as const;

export const GOVERNANCE_CHECK_COUNT = 4;

export const SUPPORTED_CONFIG_KEYS = ["token", "repo"] as const;
export type SupportedKey = (typeof SUPPORTED_CONFIG_KEYS)[number];
