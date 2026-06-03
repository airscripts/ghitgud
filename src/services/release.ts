import fs from "fs";
import path from "path";

import io from "@/core/io";
import git from "@/core/git";
import api from "@/api/releases";
import output from "@/core/output";
import logger from "@/core/logger";
import config from "@/core/config";
import template from "@/core/template";
import { GhitgudError, NotFoundError } from "@/core/errors";

import {
  TEMPLATES_DIR,
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
  since?: string;
  templateFile?: string;
}

interface DraftOptions {
  title?: string;
  notes?: string;
  level?: BumpLevel;
}

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
    groups,
    from: since,
    success: true,
  };
};

const bump = async (options: BumpOptions) => {
  if (options.create && !git.isInsideRepo()) {
    throw new GhitgudError(
      "Cannot create tag outside of a git repository. Use --repo with a local clone.",
    );
  }

  if (options.push && !options.create) {
    throw new GhitgudError("--push requires --create.");
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
  const repo = options.repo ?? config.getRepoOptional();

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
      logger.warn("Release metadata not found on GitHub.");
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

  const repo = config.getRepoOptional() ?? "unknown";
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
  const repo = config.getRepoOptional();
  if (!repo) {
    throw new GhitgudError("Repository is required.");
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
  bump,
  draft,
  notes,
  verify,
  changelog,
};
