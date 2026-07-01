import fs from "fs";
import path from "path";

import io from "@/core/io";
import git from "@/core/git";
import api from "@/api/releases";
import output from "@/core/output";
import logger from "@/core/logger";
import template from "@/core/template";
import { GitfleetError, NotFoundError } from "@/core/errors";

import {
  TEMPLATES_DIR,
  ERROR_NO_REPO,
  RELEASE_FALLBACK_SINCE,
  RELEASE_DEFAULT_GENERATED,
} from "@/core/constants";

import {
  parseCommit,
  type BumpLevel,
  groupByCategory,
  detectBumpLevel,
  renderChangelog,
} from "@/core/conventional";

interface ChangelogOptions {
  to?: string;
  since?: string;
}

interface BumpOptions {
  push?: boolean;
  create?: boolean;
  level?: BumpLevel;
}

interface VerifyOptions {
  repo?: string;
}

interface NotesOptions {
  out?: string;
  repo: string;
  since?: string;
  templateFile?: string;
}

interface DraftOptions {
  repo: string;
  title?: string;
  notes?: string;
  level?: BumpLevel;
}

interface ListOptions {
  repo: string;
  limit?: number;
}

interface CreateOptions {
  repo: string;
  title?: string;
  notes?: string;
  draft?: boolean;
  prerelease?: boolean;
  latest?: boolean;
}

interface EditOptions {
  repo: string;
  title?: string;
  notes?: string;
}

interface DownloadOptions {
  repo: string;
  pattern?: string;
  outputDir?: string;
}

interface UploadOptions {
  repo: string;
  clobber?: boolean;
}

const matchesPattern = (name: string, pattern?: string): boolean => {
  if (!pattern) return true;
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const expression = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${expression}$`).test(name);
};

const list = async (options: ListOptions) => {
  const releases = await api.list(options.repo, options.limit ?? 30);
  output.renderTable(
    releases.map((release) => ({
      Tag: release.tag_name,
      Title: release.name ?? "",
      Draft: release.draft ? "yes" : "no",
      Prerelease: release.prerelease ? "yes" : "no",
      Published: release.published_at ?? "",
    })),
    { emptyMessage: "No releases found." },
  );
  return { success: true, releases };
};

const view = async (tag: string, repo: string) => {
  const release = await api.fetchByTag(repo, tag);
  output.renderSummary("Release", [
    ["Tag", release.tag_name],
    ["Title", release.name ?? ""],
    ["Draft", release.draft ? "yes" : "no"],
    ["Prerelease", release.prerelease ? "yes" : "no"],
    ["Assets", release.assets.length],
    ["URL", release.html_url],
  ]);
  if (release.body) output.log(release.body);
  return { success: true, release };
};

const create = async (tag: string, options: CreateOptions) => {
  logger.start(`Creating release ${tag}.`);
  const release = await api.create(options.repo, {
    tag_name: tag,
    name: options.title,
    body: options.notes,
    draft: options.draft ?? false,
    prerelease: options.prerelease ?? false,
    make_latest: options.latest,
  });
  logger.success(`Created release: ${release.html_url}`);
  return { success: true, release, tag, url: release.html_url };
};

const edit = async (tag: string, options: EditOptions) => {
  if (options.title === undefined && options.notes === undefined) {
    throw new GitfleetError("Provide --title or --notes to edit a release.");
  }
  const current = await api.fetchByTag(options.repo, tag);
  const release = await api.update(options.repo, current.id, {
    name: options.title,
    body: options.notes,
  });
  logger.success(`Updated release ${tag}.`);
  return { success: true, release };
};

const remove = async (tag: string, repo: string) => {
  const release = await api.fetchByTag(repo, tag);
  await api.delete(repo, release.id);
  logger.success(`Deleted release ${tag}.`);
  return { success: true, tag };
};

const download = async (tag: string, options: DownloadOptions) => {
  const release = await api.fetchByTag(options.repo, tag);
  const assets = release.assets.filter((asset) =>
    matchesPattern(asset.name, options.pattern),
  );
  const outputDir = path.resolve(options.outputDir ?? ".");
  io.ensureDir(outputDir);
  const files: string[] = [];
  for (const asset of assets) {
    const target = path.join(outputDir, path.basename(asset.name));
    if (fs.existsSync(target)) {
      throw new GitfleetError(`File already exists: ${target}`);
    }
    const response = await api.downloadAsset(asset.browser_download_url);
    fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
    files.push(target);
  }
  logger.success(`Downloaded ${files.length} release asset(s).`);
  return { success: true, tag, files };
};

const upload = async (tag: string, files: string[], options: UploadOptions) => {
  const release = await api.fetchByTag(options.repo, tag);
  const uploaded: unknown[] = [];
  for (const file of files) {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new GitfleetError(`File not found: ${file}`);
    }
    const name = path.basename(file);
    const existing = release.assets.find((asset) => asset.name === name);
    if (existing && !options.clobber) {
      throw new GitfleetError(
        `Asset already exists: ${name}. Use --clobber to replace it.`,
      );
    }
    if (existing) await api.deleteAsset(options.repo, existing.id);
    uploaded.push(
      await api.uploadAsset(
        release.upload_url,
        name,
        "application/octet-stream",
        new Blob([fs.readFileSync(file)]),
      ),
    );
  }
  logger.success(`Uploaded ${uploaded.length} release asset(s).`);
  return { success: true, tag, assets: uploaded };
};

const deleteAsset = async (tag: string, name: string, repo: string) => {
  const release = await api.fetchByTag(repo, tag);
  const asset = release.assets.find((candidate) => candidate.name === name);
  if (!asset) throw new NotFoundError(`Asset ${name} not found on ${tag}.`);
  await api.deleteAsset(repo, asset.id);
  logger.success(`Deleted release asset ${name}.`);
  return { success: true, tag, asset: name };
};

function getLatestTag(): string | null {
  if (git.isInsideRepo()) {
    return git.getLatestTag();
  }

  return null;
}

function getCommitRange(
  since: string,
  to: string,
): Array<{ hash: string; subject: string; body: string }> {
  if (git.isInsideRepo()) {
    return git.getCommitsSinceTag(since, to);
  }

  return [];
}

function parseVersion(tag: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const match = tag.match(/^(?:v)?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return { major: 0, minor: 0, patch: 0 };
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function bumpVersion(current: string, level: BumpLevel): string {
  const v = parseVersion(current);

  switch (level) {
    case "major":
      return `${v.major + 1}.0.0`;

    case "minor":
      return `${v.major}.${v.minor + 1}.0`;

    case "patch":
      return `${v.major}.${v.minor}.${v.patch + 1}`;

    default:
      throw new GitfleetError(`Invalid bump level: ${level}.`);
  }
}

function getTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getDefaultTemplatePath(): string {
  return path.join(TEMPLATES_DIR, "release.md");
}

const changelog = async (options: ChangelogOptions) => {
  const since = options.since ?? getLatestTag() ?? RELEASE_FALLBACK_SINCE;
  const to = options.to ?? "HEAD";
  logger.start(`Generating changelog from ${since} to ${to}.`);

  const rawCommits = getCommitRange(since, to);
  const commits = rawCommits.map((c) => parseCommit(c.hash, c.subject, c.body));

  const groups = groupByCategory(commits);
  const body = renderChangelog(groups);

  if (body) {
    output.log(body);
    logger.success(`Generated changelog with ${commits.length} commit(s).`);
  } else {
    logger.warn("No conventional commits found in range.");
  }

  return {
    to,
    body,
    groups,
    from: since,
    success: true,
  };
};

const bump = async (options: BumpOptions) => {
  if (options.create && !git.isInsideRepo()) {
    throw new GitfleetError(
      "Cannot create tag outside of a git repository. Use --repo with a local clone.",
    );
  }

  if (options.push && !options.create) {
    throw new GitfleetError("--push requires --create.");
  }

  const latestTag = getLatestTag();
  if (!latestTag) {
    throw new NotFoundError("No latest tag found to bump from.");
  }

  let level = options.level;

  if (!level) {
    const rawCommits = getCommitRange(latestTag, "HEAD");
    const commits = rawCommits.map((c) =>
      parseCommit(c.hash, c.subject, c.body),
    );

    level = detectBumpLevel(commits) ?? undefined;
    if (!level) {
      logger.info("No bump-worthy commits found.");
      return { success: true, current: latestTag, next: latestTag };
    }
  }

  const nextVersion = bumpVersion(latestTag, level);
  logger.success(`Next version: ${nextVersion} (${level}).`);

  if (options.create) {
    git.createAnnotatedTag(nextVersion, `Release ${nextVersion}`);
    logger.success(`Created annotated tag ${nextVersion}.`);

    if (options.push) {
      git.pushTag(nextVersion);
      logger.success(`Pushed tag ${nextVersion} to origin.`);
    }
  }

  return { success: true, current: latestTag, next: nextVersion, level };
};

const verify = async (tag: string, options: VerifyOptions) => {
  const repo = options.repo;

  logger.start(`Verifying tag ${tag}.`);

  if (!git.tagExists(tag)) {
    if (git.isInsideRepo()) {
      git.fetchTags();
    }
  }

  if (!git.tagExists(tag)) {
    throw new NotFoundError(`Tag ${tag} not found locally or on origin.`);
  }

  const tagSig = git.verifyTag(tag);
  const commitSig = git.getCommitSignatureForTag(tag);
  let assetResult = { count: 0, valid: false };

  if (repo) {
    try {
      const release = await api.fetchByTag(repo, tag);
      const assets = release.assets ?? [];

      assetResult = {
        count: assets.length,
        valid: assets.every((a) => a.size > 0),
      };
    } catch {
      logger.warn("Release metadata not found on the provider.");
    }
  }

  output.renderSummary("Verification Result", [
    ["Tag", tag],
    ["Tag signed", tagSig.signed ? "yes" : "no"],
    ["Commit signed", commitSig.signed ? "yes" : "no"],
    ["Assets", assetResult.count],
    ["Assets valid", assetResult.valid ? "yes" : "no"],
  ]);

  return {
    tag,
    success: true,
    assets: assetResult,
    tagSignature: tagSig,
    commitSignature: commitSig,
  };
};

const notes = async (options: NotesOptions) => {
  const since = options.since ?? getLatestTag() ?? RELEASE_FALLBACK_SINCE;
  const to = "HEAD";
  logger.start("Generating release notes.");

  const rawCommits = getCommitRange(since, to);
  const commits = rawCommits.map((c) => parseCommit(c.hash, c.subject, c.body));
  const groups = groupByCategory(commits);
  const changelogBody = renderChangelog(groups);

  const currentTag = getLatestTag();
  const nextVersion = currentTag ? bumpVersion(currentTag, "patch") : "0.1.0";

  const templatePath =
    options.templateFile && io.fileExists(options.templateFile)
      ? options.templateFile
      : getDefaultTemplatePath();

  const templateContent = io.fileExists(templatePath)
    ? (() => {
        try {
          return fs.readFileSync(templatePath, "utf8");
        } catch {
          return "{{CHANGELOG}}";
        }
      })()
    : "{{CHANGELOG}}";

  const repo = options.repo;
  const rendered = template.render(templateContent, {
    VERSION: nextVersion,
    CHANGELOG: changelogBody,
    REPO: repo,
    DATE: getTodayIso(),
    PREVIOUS_TAG: since,
  });

  if (options.out) {
    io.ensureDir(path.dirname(options.out));
    fs.writeFileSync(options.out, rendered, "utf8");
    logger.success(`Saved release notes to ${options.out}.`);
  } else {
    output.log(rendered);
  }

  return {
    success: true,
    body: rendered,

    variables: {
      REPO: repo,
      DATE: getTodayIso(),
      PREVIOUS_TAG: since,
      VERSION: nextVersion,
      CHANGELOG: changelogBody,
    },
  };
};

const draft = async (options: DraftOptions) => {
  const repo = options.repo;

  if (!repo) {
    throw new GitfleetError(ERROR_NO_REPO);
  }

  const latestTag = getLatestTag();
  if (!latestTag) {
    throw new NotFoundError("No latest tag found to bump from.");
  }

  const level = options.level ?? "patch";
  const nextVersion = bumpVersion(latestTag, level);
  const title = options.title ?? nextVersion;
  logger.start(`Creating draft release ${nextVersion}.`);

  let body: string | undefined;
  let generateReleaseNotes = false;

  if (options.notes && options.notes !== RELEASE_DEFAULT_GENERATED) {
    body = options.notes;
  } else {
    generateReleaseNotes = true;
  }

  const release = await api.create(repo, {
    body,
    name: title,
    draft: true,
    tag_name: nextVersion,
    generate_release_notes: generateReleaseNotes,
  });

  logger.success(`Created draft release: ${release.html_url}`);

  return {
    release,
    success: true,
    tag: nextVersion,
    url: release.html_url,
  };
};

export default {
  list,
  view,
  edit,
  create,
  remove,
  upload,
  download,
  deleteAsset,
  bump,
  draft,
  notes,
  verify,
  changelog,
};
