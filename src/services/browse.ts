import repoResolver from "@/core/repo";
import logger from "@/core/logger";

const GITHUB_BASE = "https://github.com";

const buildRepoUrl = (
  repo: string,
  options: { path?: string; line?: string } = {},
) => {
  let url = `${GITHUB_BASE}/${repo}`;
  if (options.path) {
    url += `/blob/main/${options.path}`;
    if (options.line) {
      url += `#L${options.line}`;
    }
  }
  return url;
};

const buildIssuesUrl = (repo: string) => `${GITHUB_BASE}/${repo}/issues`;

const buildPullsUrl = (repo: string) => `${GITHUB_BASE}/${repo}/pulls`;

const buildActionsUrl = (repo: string) => `${GITHUB_BASE}/${repo}/actions`;

const buildSettingsUrl = (repo: string) => `${GITHUB_BASE}/${repo}/settings`;

const buildReleasesUrl = (repo: string) => `${GITHUB_BASE}/${repo}/releases`;

const buildNumberUrl = (repo: string, number: number) =>
  `${GITHUB_BASE}/${repo}/issues/${number}`;

const open = async (url: string) => {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  try {
    const { execSync } = await import("child_process");
    execSync(`${command} "${url}"`, { stdio: "pipe" });
    logger.success(`Opened ${url}.`);
  } catch {
    logger.success(`URL: ${url}`);
  }
  return { success: true, url };
};

const browseRepo = async (options: {
  repo?: string;
  path?: string;
  line?: string;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  const url = buildRepoUrl(repo, { path: options.path, line: options.line });
  return open(url);
};

const browseIssues = async (options: { repo?: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  return open(buildIssuesUrl(repo));
};

const browsePulls = async (options: { repo?: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  return open(buildPullsUrl(repo));
};

const browseActions = async (options: { repo?: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  return open(buildActionsUrl(repo));
};

const browseSettings = async (options: { repo?: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  return open(buildSettingsUrl(repo));
};

const browseReleases = async (options: { repo?: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  return open(buildReleasesUrl(repo));
};

const browseNumber = async (number: number, options: { repo?: string }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  return open(buildNumberUrl(repo, number));
};

export default {
  browseRepo,
  browseIssues,
  browsePulls,
  browseActions,
  browseSettings,
  browseReleases,
  browseNumber,
  buildRepoUrl,
  buildIssuesUrl,
  buildNumberUrl,
};
