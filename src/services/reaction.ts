import api, { VALID_EMOJIS } from "@/api/reactions";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GhitgudError } from "@/core/errors";

interface ReactionEntry {
  id: number;
  content: string;
  user: { login: string } | null;
  createdAt: string;
}

const normalize = (raw: Record<string, unknown>): ReactionEntry => ({
  id: raw.id as number,
  content: raw.content as string,
  user: raw.user
    ? { login: (raw.user as Record<string, unknown>).login as string }
    : null,
  createdAt: raw.created_at as string,
});

const list = async (options: {
  repo?: string;
  issue?: number;
  comment?: number;
  reviewComment?: number;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start("Loading reactions.");
  let response: Response;
  if (options.reviewComment) {
    response = await api.listForReviewComment(repo, options.reviewComment);
  } else if (options.comment) {
    response = await api.listForComment(repo, options.comment);
  } else if (options.issue) {
    response = await api.listForIssue(repo, options.issue);
  } else {
    throw new GhitgudError(
      "Provide --issue, --comment, or --review-comment to specify the target.",
    );
  }
  const reactions = ((await response.json()) as Record<string, unknown>[]).map(
    normalize,
  );
  output.renderTable(
    reactions.map((r) => ({
      id: r.id,
      emoji: r.content,
      user: r.user?.login ?? "-",
      created: r.createdAt,
    })),
    { emptyMessage: "No reactions found." },
  );
  logger.success(`Loaded ${reactions.length} reaction(s).`);
  return { success: true, reactions };
};

const add = async (options: {
  repo?: string;
  issue?: number;
  comment?: number;
  reviewComment?: number;
  emoji: string;
}) => {
  if (!VALID_EMOJIS.includes(options.emoji)) {
    throw new GhitgudError(
      `Invalid emoji "${options.emoji}". Valid: ${VALID_EMOJIS.join(", ")}.`,
    );
  }
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Adding ${options.emoji} reaction.`);
  let response: Response;
  if (options.reviewComment) {
    response = await api.createForReviewComment(
      repo,
      options.reviewComment,
      options.emoji,
    );
  } else if (options.comment) {
    response = await api.createForComment(repo, options.comment, options.emoji);
  } else if (options.issue) {
    response = await api.createForIssue(repo, options.issue, options.emoji);
  } else {
    throw new GhitgudError(
      "Provide --issue, --comment, or --review-comment to specify the target.",
    );
  }
  const result = (await response.json()) as Record<string, unknown>;
  logger.success(`Added ${options.emoji} reaction.`);
  return { success: true, reaction: normalize(result) };
};

const remove = async (options: {
  repo?: string;
  issue?: number;
  comment?: number;
  reviewComment?: number;
  reactionId: number;
}) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start("Removing reaction.");
  if (options.reviewComment) {
    await api.deleteForReviewComment(
      repo,
      options.reviewComment,
      options.reactionId,
    );
  } else if (options.comment) {
    await api.deleteForComment(repo, options.comment, options.reactionId);
  } else if (options.issue) {
    await api.deleteForIssue(repo, options.issue, options.reactionId);
  } else {
    throw new GhitgudError(
      "Provide --issue, --comment, or --review-comment to specify the target.",
    );
  }
  logger.success("Removed reaction.");
  return { success: true, reaction: options.reactionId };
};

export default { list, add, remove };
