import client from "./client";

const list = (repo: string, issueNumber: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/issues/${issueNumber}/comments`);

const create = (
  repo: string,
  issueNumber: number,
  body: string,
): Promise<Response> =>
  client.postTokenRequired(`/repos/${repo}/issues/${issueNumber}/comments`, {
    body,
  });

const get = (repo: string, commentId: number): Promise<Response> =>
  client.getTokenRequired(`/repos/${repo}/issues/comments/${commentId}`);

const update = (
  repo: string,
  commentId: number,
  body: string,
): Promise<Response> =>
  client.patchTokenRequired(`/repos/${repo}/issues/comments/${commentId}`, {
    body,
  });

const remove = (repo: string, commentId: number): Promise<Response> =>
  client.deleteTokenRequired(`/repos/${repo}/issues/comments/${commentId}`);

export default { list, create, get, update, remove };
