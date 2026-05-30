import api from "@/api/review";
import fs from "fs";
import output from "@/core/output";
import logger from "@/core/logger";
import config from "@/core/config";
import git from "@/core/git";

import {
  ReviewComment,
  ReviewThread,
  ReviewSuggestion,
  ReviewApplyResult,
} from "@/types";

import {
  ERROR_NO_REPO,
  ERROR_REVIEW_PR_REQUIRED,
  ERROR_REVIEW_FILE_REQUIRED,
  ERROR_REVIEW_LINE_REQUIRED,
  ERROR_REVIEW_BODY_REQUIRED,
  ERROR_REVIEW_NO_THREADS,
  ERROR_REVIEW_NO_SUGGESTIONS,
  ERROR_REVIEW_THREAD_NOT_FOUND,
  ERROR_REVIEW_COMMIT_SHA_REQUIRED,
} from "@/core/constants";

import { ConfigError, GhitgudError } from "@/core/errors";
import type { PrFile } from "@/api/review";

function resolveRepo(repo?: string): string {
  const resolved = repo || config.getRepoOptional();
  if (!resolved) throw new ConfigError(ERROR_NO_REPO);
  return resolved;
}

async function getCommitShaForFile(
  repo: string,
  pr: number,
  filePath: string,
): Promise<string> {
  const response = await api.listFiles(repo, pr);
  const files = (await response.json()) as PrFile[];
  const match = files.find((f) => f.filename === filePath);

  if (!match) throw new GhitgudError(ERROR_REVIEW_COMMIT_SHA_REQUIRED);
  return match.sha;
}

function parseSuggestionBody(
  body: string,
): { original: string; suggested: string } | null {
  const match = body.match(/```suggestion\n([\s\S]*?)\n```/);

  if (!match) {
    return null;
  }

  const lines = body.split("\n");
  const originalLine = lines.find((line) => line.startsWith("```suggestion"));

  if (!originalLine) {
    return null;
  }

  const idx = lines.indexOf(originalLine);
  const previousLine = lines[idx - 1];
  const original = previousLine ? previousLine.trim() : "";
  const suggested = match[1];

  return { original, suggested };
}

function groupCommentsIntoThreads(comments: ReviewComment[]): ReviewThread[] {
  const topLevel = comments.filter((c) => !c.inReplyToId);
  const replies = comments.filter((c) => c.inReplyToId);

  return topLevel.map((parent) => {
    const threadReplies = replies.filter((r) => r.inReplyToId === parent.id);
    return {
      id: parent.id,
      path: parent.path,
      line: parent.line,
      comments: [parent, ...threadReplies],
      resolved: parent.body.includes("[resolved]"),
    };
  });
}

interface CommentOptions {
  pr: number;
  file: string;
  line: number;
  body: string;
  side?: "LEFT" | "RIGHT";
  repo?: string;
}

const comment = async (options: CommentOptions) => {
  if (!options.pr) throw new GhitgudError(ERROR_REVIEW_PR_REQUIRED);
  if (!options.file) throw new GhitgudError(ERROR_REVIEW_FILE_REQUIRED);
  if (!options.line) throw new GhitgudError(ERROR_REVIEW_LINE_REQUIRED);
  if (!options.body) throw new GhitgudError(ERROR_REVIEW_BODY_REQUIRED);

  const repo = resolveRepo(options.repo);
  logger.start(`Creating review comment on PR #${options.pr}.`);

  const commitId = await getCommitShaForFile(repo, options.pr, options.file);

  const response = await api.createComment(repo, options.pr, {
    body: options.body,
    path: options.file,
    line: options.line,
    commit_id: commitId,
    side: options.side ?? "RIGHT",
  });

  const data = (await response.json()) as ReviewComment;
  logger.success(`Created review comment ${data.id}.`);

  return { success: true, commentId: data.id };
};

const threads = async (pr: number, repo?: string) => {
  if (!pr) throw new GhitgudError(ERROR_REVIEW_PR_REQUIRED);

  const targetRepo = resolveRepo(repo);
  logger.start(`Fetching review threads for PR #${pr}.`);

  const response = await api.listComments(targetRepo, pr);
  const comments = (await response.json()) as ReviewComment[];

  if (!comments.length) {
    throw new GhitgudError(ERROR_REVIEW_NO_THREADS);
  }

  const threadList = groupCommentsIntoThreads(comments);

  output.renderSummary("Review Threads", [
    ["Threads", threadList.length],
    ["Comments", comments.length],
    ["Resolved", threadList.filter((t) => t.resolved).length],
  ]);

  for (const thread of threadList) {
    output.renderSection(`Thread ${thread.id} — ${thread.path}:${thread.line}`);
    output.renderKeyValues([
      ["Status", thread.resolved ? "resolved" : "open"],
      ["Replies", thread.comments.length - 1],
    ]);

    output.renderTable(
      thread.comments.map((c) => ({
        user: c.user.login,
        body: c.body.slice(0, 80),
        createdAt: c.createdAt,
      })),
      { emptyMessage: "No comments." },
    );
  }

  logger.success("Review threads loaded.");
  return { success: true, metadata: threadList };
};

const resolve = async (threadId: number, repo?: string, pr?: number) => {
  if (!threadId) throw new GhitgudError(ERROR_REVIEW_THREAD_NOT_FOUND);

  const targetRepo = resolveRepo(repo);
  logger.start(`Resolving review thread ${threadId}.`);

  if (!pr) {
    throw new GhitgudError(ERROR_REVIEW_PR_REQUIRED);
  }

  const response = await api.listComments(targetRepo, pr);
  const comments = (await response.json()) as ReviewComment[];
  const target = comments.find((c) => c.id === threadId);

  if (!target) throw new GhitgudError(ERROR_REVIEW_THREAD_NOT_FOUND);

  let resolvedBody: string;
  if (target.body.includes("[resolved]")) {
    resolvedBody = target.body;
  } else {
    resolvedBody = `${target.body}\n\n[resolved]`;
  }

  await api.updateComment(targetRepo, threadId, { body: resolvedBody });
  logger.success(`Marked thread ${threadId} as resolved.`);

  return { success: true, threadId };
};

interface SuggestOptions {
  pr: number;
  file: string;
  line: number;
  replace: string;
  repo?: string;
}

const suggest = async (options: SuggestOptions) => {
  if (!options.pr) throw new GhitgudError(ERROR_REVIEW_PR_REQUIRED);
  if (!options.file) throw new GhitgudError(ERROR_REVIEW_FILE_REQUIRED);
  if (!options.line) throw new GhitgudError(ERROR_REVIEW_LINE_REQUIRED);
  if (!options.replace) throw new GhitgudError(ERROR_REVIEW_BODY_REQUIRED);

  const repo = resolveRepo(options.repo);
  logger.start(`Creating suggestion on PR #${options.pr}.`);

  const commitId = await getCommitShaForFile(repo, options.pr, options.file);
  const suggestionBody = `\`\`\`suggestion\n${options.replace}\n\`\`\``;

  const response = await api.createComment(repo, options.pr, {
    body: suggestionBody,
    path: options.file,
    line: options.line,
    commit_id: commitId,
    side: "RIGHT",
  });

  const data = (await response.json()) as ReviewComment;
  logger.success(`Created suggestion ${data.id}.`);

  return { success: true, commentId: data.id };
};

const apply = async (pr: number, repo?: string, pushFlag = false) => {
  if (!pr) throw new GhitgudError(ERROR_REVIEW_PR_REQUIRED);

  const targetRepo = resolveRepo(repo);
  logger.start(`Fetching suggestions for PR #${pr}.`);

  const response = await api.listComments(targetRepo, pr);
  const comments = (await response.json()) as ReviewComment[];

  const suggestions: ReviewSuggestion[] = [];
  for (const comment of comments) {
    const parsed = parseSuggestionBody(comment.body);
    if (parsed) {
      suggestions.push({
        id: comment.id,
        path: comment.path,
        line: comment.line,
        originalText: parsed.original,
        suggestedText: parsed.suggested,
      });
    }
  }

  if (!suggestions.length) {
    throw new GhitgudError(ERROR_REVIEW_NO_SUGGESTIONS);
  }

  logger.start(`Applying ${suggestions.length} suggestion(s).`);

  const prResponse = await api.getPrDetails(targetRepo, pr);
  const prData = (await prResponse.json()) as { head: { ref: string } };
  const branch = prData.head.ref;

  const currentBranch = git.getCurrentBranch();
  const branchExists = git.branchExistsLocally(branch);

  if (!branchExists) {
    git.fetchBranch("origin", branch);
  }

  git.checkoutBranch(branch);

  const applied: number[] = [];
  const skipped: number[] = [];

  for (const suggestion of suggestions) {
    const filePath = suggestion.path;
    if (!git.isInsideRepo()) {
      skipped.push(suggestion.id);
      continue;
    }

    const repoRoot = git.getRepoRoot();
    const absolutePath = `${repoRoot}/${filePath}`;

    try {
      const content = fs.readFileSync(absolutePath, "utf8");
      const lines = content.split("\n");

      if (lines[suggestion.line - 1]?.trim() !== suggestion.originalText) {
        skipped.push(suggestion.id);
        continue;
      }

      lines[suggestion.line - 1] = suggestion.suggestedText;
      fs.writeFileSync(absolutePath, lines.join("\n"), "utf8");
      applied.push(suggestion.id);
    } catch {
      skipped.push(suggestion.id);
    }
  }

  if (applied.length) {
    git.stageFiles();
    git.commitChanges(`Apply review suggestions from PR #${pr}`);

    if (pushFlag) {
      git.pushToRemote("origin", branch, false);
      logger.success(`Applied ${applied.length} suggestion(s) and pushed.`);
    } else {
      logger.success(
        `Applied ${applied.length} suggestion(s). Commit ready to push.`,
      );
    }
  }

  if (skipped.length) {
    logger.warn(
      `Skipped ${skipped.length} suggestion(s) due to mismatched context.`,
    );
  }

  if (currentBranch !== branch) {
    git.checkoutBranch(currentBranch);
  }

  const result: ReviewApplyResult = {
    applied: applied.length,
    skipped: skipped.length,
    branch,
  };

  return { success: true, metadata: result };
};

export default {
  comment,
  threads,
  resolve,
  suggest,
  apply,
};
