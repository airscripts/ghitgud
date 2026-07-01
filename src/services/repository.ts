import reposApi, {
  CreateRepoOptions,
  GitHubRepoResponse,
  UpdateRepoOptions,
} from "@/api/repos";

import git from "@/core/git";
import output from "@/core/output";
import logger from "@/core/logger";
import { GitfleetError } from "@/core/errors";

type RepoType = "public" | "private" | "all";

const renderRepository = (repo: GitHubRepoResponse): void => {
  output.renderKeyValues([
    ["Name", repo.full_name],
    ["Description", repo.description ?? "-"],
    ["Visibility", repo.visibility ?? (repo.private ? "private" : "public")],
    ["Archived", repo.archived ? "yes" : "no"],
    ["Fork", repo.fork ? "yes" : "no"],
    ["Default branch", repo.default_branch],
    ["Stars", repo.stargazers_count ?? 0],
    ["Open issues", repo.open_issues_count ?? 0],
    ["URL", repo.html_url ?? "-"],
  ]);
};

const create = async (options: CreateRepoOptions) => {
  if (options.ownerType === "org" && !options.owner) {
    throw new GitfleetError(
      "--owner is required for organization repositories.",
    );
  }

  if (options.ownerType !== "org" && options.visibility === "internal") {
    throw new GitfleetError(
      "Internal visibility requires an organization owner.",
    );
  }

  if (options.template && options.template.split("/").length !== 2) {
    throw new GitfleetError("Template must use owner/repo format.");
  }

  logger.start(`Creating repository ${options.name}.`);
  const repository = await reposApi.create(options);
  logger.success(`Created ${repository.full_name}.`);
  return { success: true, repository };
};

const list = async (options: {
  owner?: string;
  ownerType?: "user" | "org";
  type?: RepoType;
}) => {
  logger.start("Loading repositories.");

  const repositories = options.owner
    ? options.ownerType === "org"
      ? await reposApi.fetchOrg(options.owner)
      : await reposApi.fetchUser(options.owner)
    : await reposApi.fetchUserRepos();

  const type = options.type ?? "all";
  const filtered = repositories.filter(
    (repo) =>
      type === "all" || (type === "private" ? repo.private : !repo.private),
  );

  output.renderTable(
    filtered.map((repo) => ({
      name: repo.fullName,
      branch: repo.defaultBranch,
      fork: repo.fork ? "yes" : "no",
      archived: repo.archived ? "yes" : "no",
      visibility: repo.private ? "private" : "public",
    })),

    { emptyMessage: "No repositories found." },
  );

  logger.success(`Loaded ${filtered.length} repositories.`);
  return { success: true, repositories: filtered };
};

const view = async (repo: string) => {
  logger.start(`Loading ${repo}.`);
  const repository = await reposApi.get(repo);
  renderRepository(repository);
  logger.success(`Loaded ${repo}.`);
  return { success: true, repository };
};

const clone = async (repo: string, depth?: number) => {
  if (depth !== undefined && (!Number.isInteger(depth) || depth <= 0)) {
    throw new GitfleetError("Depth must be a positive integer.");
  }

  const repository = await reposApi.get(repo);
  git.cloneRepository(
    repository.clone_url ?? `https://github.com/${repo}.git`,
    { depth },
  );

  logger.success(`Cloned ${repo}.`);
  return { success: true, repository: repo };
};

const remove = async (repo: string) => {
  await reposApi.delete(repo);
  logger.success(`Deleted ${repo}.`);
  return { success: true, repository: repo };
};

const update = async (repo: string, options: UpdateRepoOptions) => {
  if (!Object.keys(options).length) {
    throw new GitfleetError("At least one repository change is required.");
  }

  const repository = await reposApi.update(repo, options);
  logger.success(`Updated ${repository.full_name}.`);
  return { success: true, repository };
};

const star = async (repo: string) => {
  await reposApi.star(repo);
  logger.success(`Starred ${repo}.`);
  return { success: true, repository: repo };
};

const unstar = async (repo: string) => {
  await reposApi.unstar(repo);
  logger.success(`Unstarred ${repo}.`);
  return { success: true, repository: repo };
};

const fork = async (
  repo: string,
  options: { clone?: boolean; remoteName?: string },
) => {
  logger.start(`Forking ${repo}.`);
  let repository = await reposApi.fork(repo);

  if (options.clone) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        repository = await reposApi.get(repository.full_name);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    }

    git.cloneRepository(
      repository.clone_url ?? `https://github.com/${repository.full_name}.git`,
      { remoteName: options.remoteName ?? "origin" },
    );
  }

  logger.success(`Forked as ${repository.full_name}.`);
  return { success: true, repository };
};

const sync = async (repo: string, branch?: string) => {
  const current = git.parseRepoFromRemoteUrl(git.getRemoteUrl());

  if (current?.toLowerCase() !== repo.toLowerCase()) {
    throw new GitfleetError(
      `Current checkout is ${current ?? "unknown"}, not ${repo}.`,
    );
  }

  const syncedBranch = git.syncBranch(branch);
  logger.success(`Synced ${repo}:${syncedBranch}.`);
  return { success: true, repository: repo, branch: syncedBranch };
};

export default {
  star,
  list,
  view,
  fork,
  sync,
  clone,
  create,
  remove,
  update,
  unstar,
};
