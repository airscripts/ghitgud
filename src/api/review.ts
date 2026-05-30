import client from "./client";

interface CreateCommentBody {
  body: string;
  path: string;
  line: number;
  commit_id: string;
  side?: "LEFT" | "RIGHT";
  in_reply_to?: number;
}

interface PrFile {
  filename: string;
  sha: string;
}

const listComments = async (repo: string, pr: number): Promise<Response> => {
  return client.getTokenRequired(`/repos/${repo}/pulls/${pr}/comments`);
};

const createComment = async (
  repo: string,
  pr: number,
  body: CreateCommentBody,
): Promise<Response> => {
  return client.postTokenRequired(`/repos/${repo}/pulls/${pr}/comments`, body);
};

const updateComment = async (
  repo: string,
  commentId: number,
  body: { body: string },
): Promise<Response> => {
  return client.patchTokenRequired(
    `/repos/${repo}/pulls/comments/${commentId}`,
    body,
  );
};

const listFiles = async (repo: string, pr: number): Promise<Response> => {
  return client.getTokenRequired(`/repos/${repo}/pulls/${pr}/files`);
};

const getPrDetails = async (repo: string, pr: number): Promise<Response> => {
  return client.getTokenRequired(`/repos/${repo}/pulls/${pr}`);
};

export default {
  listComments,
  createComment,
  updateComment,
  listFiles,
  getPrDetails,
};
export type { CreateCommentBody, PrFile };
