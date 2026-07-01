import client from "@/providers/github/client";

const VALID_EMOJIS = [
  "+1",
  "-1",
  "laugh",
  "confused",
  "heart",
  "hooray",
  "rocket",
  "eyes",
];

const listForIssue = (repo: string, issueNumber: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/issues/${issueNumber}/reactions`);

const createForIssue = (
  repo: string,
  issueNumber: number,
  content: string,
): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/issues/${issueNumber}/reactions`, {
    content,
  });

const deleteForIssue = (
  repo: string,
  issueNumber: number,
  reactionId: number,
): Promise<Response> =>
  client.deleteTokenRequired(
    `/repos/${repo}/issues/${issueNumber}/reactions/${reactionId}`,
  );

const listForComment = (repo: string, commentId: number): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/issues/comments/${commentId}/reactions`,
  );

const createForComment = (
  repo: string,
  commentId: number,
  content: string,
): Promise<Response> =>
  client.postTokenRequired(
    `/repos/${repo}/issues/comments/${commentId}/reactions`,
    { content },
  );

const deleteForComment = (
  repo: string,
  commentId: number,
  reactionId: number,
): Promise<Response> =>
  client.deleteTokenRequired(
    `/repos/${repo}/issues/comments/${commentId}/reactions/${reactionId}`,
  );

const listForReviewComment = (
  repo: string,
  commentId: number,
): Promise<Response> =>
  client.getTokenRequired(
    `/repos/${repo}/pulls/comments/${commentId}/reactions`,
  );

const createForReviewComment = (
  repo: string,
  commentId: number,
  content: string,
): Promise<Response> =>
  client.postTokenRequired(
    `/repos/${repo}/pulls/comments/${commentId}/reactions`,
    { content },
  );

const deleteForReviewComment = (
  repo: string,
  commentId: number,
  reactionId: number,
): Promise<Response> =>
  client.deleteTokenRequired(
    `/repos/${repo}/pulls/comments/${commentId}/reactions/${reactionId}`,
  );

export default {
  listForIssue,
  createForIssue,
  deleteForIssue,
  listForComment,
  createForComment,
  deleteForComment,
  listForReviewComment,
  createForReviewComment,
  deleteForReviewComment,
};
export { VALID_EMOJIS };
