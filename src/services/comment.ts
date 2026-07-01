import api from "@/api/comments";
import output from "@/core/output";
import logger from "@/core/logger";
import repoResolver from "@/core/repo";
import { GitfleetError } from "@/core/errors";

interface CommentEntry {
  id: number;
  body: string;
  user: string | null;
  createdAt: string;
  updatedAt: string;
}

const normalize = (raw: Record<string, unknown>): CommentEntry => ({
  id: raw.id as number,
  body: (raw.body as string) ?? "",
  user: raw.user
    ? ((raw.user as Record<string, unknown>).login as string)
    : null,
  createdAt: raw.created_at as string,
  updatedAt: raw.updated_at as string,
});

const list = async (options: { repo?: string; issue?: number }) => {
  if (!options.issue) throw new GitfleetError("--issue is required.");
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Loading comments for issue #${options.issue}.`);
  const response = await api.list(repo, options.issue);
  const comments = ((await response.json()) as Record<string, unknown>[]).map(
    normalize,
  );
  output.renderTable(
    comments.map((c) => ({
      id: c.id,
      author: c.user ?? "-",
      body: c.body.length > 80 ? c.body.slice(0, 80) + "..." : c.body,
      created: c.createdAt,
    })),
    { emptyMessage: "No comments found." },
  );
  logger.success(`Loaded ${comments.length} comment(s).`);
  return { success: true, comments };
};

const reply = async (options: {
  repo?: string;
  issue?: number;
  body: string;
}) => {
  if (!options.issue) throw new GitfleetError("--issue is required.");
  if (!options.body) throw new GitfleetError("--body is required.");
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Commenting on issue #${options.issue}.`);
  const response = await api.create(repo, options.issue, options.body);
  const result = (await response.json()) as Record<string, unknown>;
  logger.success(`Commented on issue #${options.issue}.`);
  return { success: true, comment: normalize(result) };
};

const remove = async (options: { repo?: string; commentId: number }) => {
  const repo = options.repo ?? (await repoResolver.resolveRepo());
  logger.start(`Deleting comment ${options.commentId}.`);
  await api.remove(repo, options.commentId);
  logger.success(`Deleted comment ${options.commentId}.`);
  return { success: true, comment: options.commentId };
};

export default { list, reply, remove };
