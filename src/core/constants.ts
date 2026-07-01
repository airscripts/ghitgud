import os from "os";
import path from "path";

export const GITFLEET_FOLDER = path.join(os.homedir(), ".config", "gitfleet");
export const CREDENTIALS_FILE = "credentials.json";
export const METADATA_FILE = "labels.json";
export const GITFLEET_RC_FILE = ".gitfleetrc";
export const DEFAULT_PROFILE_NAME = "default";
export const ENCODING = "utf8";
export const GITFLEET_PROFILE_ENV = "GITFLEET_PROFILE";

export const CREDENTIALS_PATH = path.join(GITFLEET_FOLDER, CREDENTIALS_FILE);
export const METADATA_FILE_PATH = path.join(GITFLEET_FOLDER, METADATA_FILE);
export const TEMPLATES_DIR = path.join(__dirname, "templates");

export const GITHUB_API_VERSION = "2026-03-10";
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
export const ERROR_AUTH_NO_TOKEN = "No token found. Run: gitfleet auth login";
export const ERROR_AUTH_FAILED = "Authentication failed. Check your token.";
export const INFO_AUTH_LOGGED_IN = "Logged in as";
export const INFO_AUTH_LOGGED_OUT = "Logged out successfully.";
export const ERROR_NO_GIT_ROOT = "Git repository root not found.";
export const ERROR_NO_REMOTE_URL = "Unable to detect repository remote.";

export const ERROR_NO_REPO =
  "No repository specified. Use --repo namespace/repository or run inside a git repository with a supported remote.";

export const ERROR_NO_TOKEN = "Token not configured. Run: gitfleet auth login.";

export const ERROR_RATE_LIMIT_UNAUTHENTICATED = `Rate limit reached (60/hour). Run: gitfleet auth login for a higher authenticated limit.`;
export const ERROR_RATE_LIMIT_AUTHENTICATED = "Rate limit reached.";
export const ERROR_TOKEN_REQUIRED = "This operation requires a token.";

export const ERROR_UNSUPPORTED_KEY = "Trying to set unsupported key.";
export const ERROR_NO_METADATA = "No metadata file found.";
export const ERROR_NO_REPO_TARGET = "No repository target provided.";

export const ERROR_MUTATION_REQUIRES_YES =
  "This operation changes repositories. Re-run with --yes to apply.";

export const ERROR_RULESET_REQUIRED = "Ruleset file is required.";
export const ERROR_AUDIT_TARGET_REQUIRED =
  "Either --org or --enterprise must be provided.";

export const ERROR_DEPENDABOT_ALERT_REQUIRED =
  "Dependabot alert number is required.";

export const ERROR_DEPENDABOT_DISMISS_REASON_REQUIRED =
  "Dependabot dismiss reason is required.";

export const ERROR_INVALID_DEPENDABOT_DISMISS_REASON =
  "Invalid Dependabot dismiss reason.";

export const ERROR_LABEL_SOURCE_REQUIRED =
  "Either --template or --metadata must be provided.";

export const INFO_NO_NOTIFICATIONS = "No notifications found.";
export const DEFAULT_OUTPUT_DIR = ".gitfleet/pipelines";
export const WORKFLOW_DEFAULT_DIR = ".github/workflows";
export const WORKFLOW_FILE_EXTENSIONS = [".yml", ".yaml"] as const;

export const ERROR_WORKFLOW_NOT_FOUND =
  "No workflow files were found in .github/workflows.";

export const ERROR_WORKFLOW_INVALID_YAML =
  "Workflow file contains invalid YAML.";

export const ERROR_RUN_ID_REQUIRED = "Run id is required.";
export const ERROR_CACHE_KEY_REQUIRED = "Cache key is required.";

export const ERROR_VARIABLE_NAME_REQUIRED = "Variable name is required.";
export const ERROR_VARIABLE_VALUE_REQUIRED = "Variable value is required.";
export const ERROR_SECRET_NAME_REQUIRED = "Secret name is required.";
export const ERROR_SECRET_VALUE_REQUIRED = "Secret value is required.";
export const ERROR_ENVIRONMENT_NAME_REQUIRED = "Environment name is required.";
export const ERROR_SECRET_ENCRYPTION_FAILED = "Failed to encrypt secret value.";

export const INFO_CACHE_METADATA_ONLY =
  "Cache metadata found, but cache byte download is not available through the official API.";

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
export const COMPLIANCE_CHECK_COUNT = 9;

export const DEPENDABOT_DISMISS_REASONS = [
  "fix_started",
  "inaccurate",
  "no_bandwidth",
  "not_used",
  "tolerable_risk",
] as const;

export const SUPPORTED_CONFIG_KEYS = [
  "editor",
  "pager",
  "prefer_editor",
  "prompt",
  "git_protocol",
  "browser",
] as const;
export type SupportedKey = (typeof SUPPORTED_CONFIG_KEYS)[number];

export const ERROR_CHANGE_NUMBER_REQUIRED = "Change number is required.";
export const ERROR_REVIEW_FILE_REQUIRED =
  "File path is required for review comments.";

export const ERROR_REVIEW_LINE_REQUIRED =
  "Line number is required for review comments.";

export const ERROR_REVIEW_BODY_REQUIRED = "Comment body is required.";
export const ERROR_REVIEW_NO_THREADS = "No review threads found on this PR.";
export const ERROR_REVIEW_NO_SUGGESTIONS = "No suggestions found to apply.";
export const ERROR_REVIEW_THREAD_NOT_FOUND = "Review thread not found.";

export const ERROR_REVIEW_COMMIT_SHA_REQUIRED =
  "Unable to determine commit SHA for comment.";

export const RELEASE_FALLBACK_SINCE = "HEAD~20";
export const RELEASE_TEMPLATE_FILE = "release.md";
export const RELEASE_DEFAULT_GENERATED = "generated";

export const SEARCH_DEFAULT_LIMIT = 30;
export const SEARCH_MAX_PER_PAGE = 100;
export const ERROR_SEARCH_QUERY_REQUIRED = "Search query is required.";

export const ALIAS_CONFIG_KEY = "aliases";
export const COPILOT_CLI_BINARY = "github-copilot-cli";
export const SKILLS_DIR = path.join(GITFLEET_FOLDER, "skills");
export const EXTENSIONS_DIR = path.join(GITFLEET_FOLDER, "extensions");

export const ERROR_ALIAS_NOT_FOUND = "Alias not found.";
export const ERROR_ALIAS_EXISTS =
  "Alias already exists. Use --force to overwrite.";
export const ERROR_ALIAS_NAME_REQUIRED = "Alias name is required.";
export const ERROR_ALIAS_EXPANSION_REQUIRED = "Alias expansion is required.";
