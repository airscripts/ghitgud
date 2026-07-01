import client from "@/providers/github/client";

interface GistFileInput {
  content?: string;
  filename?: string | null;
}

interface GistInput {
  description?: string;
  public?: boolean;
  files: Record<string, GistFileInput | null>;
}

const list = (isPublic: boolean, limit: number): Promise<Response> =>
  client.getTokenRequired(
    `/gists${isPublic ? "/public" : ""}?per_page=${limit}`,
  );

const get = (id: string): Promise<Response> =>
  client.getTokenRequired(`/gists/${encodeURIComponent(id)}`);

const create = (input: GistInput): Promise<Response> =>
  client.postTokenRequired("/gists", input);

const update = (id: string, input: GistInput): Promise<Response> =>
  client.patchTokenRequired(`/gists/${encodeURIComponent(id)}`, input);

const remove = (id: string): Promise<Response> =>
  client.deleteTokenRequired(`/gists/${encodeURIComponent(id)}`);

const fork = (id: string): Promise<Response> =>
  client.postTokenRequired(`/gists/${encodeURIComponent(id)}/forks`, {});

const star = (id: string): Promise<Response> =>
  client.putTokenRequired(`/gists/${encodeURIComponent(id)}/star`, {});

const unstar = (id: string): Promise<Response> =>
  client.deleteTokenRequired(`/gists/${encodeURIComponent(id)}/star`);

const listComments = (id: string): Promise<Response> =>
  client.getTokenRequired(`/gists/${encodeURIComponent(id)}/comments`);

const createComment = (id: string, body: string): Promise<Response> =>
  client.postTokenRequired(`/gists/${encodeURIComponent(id)}/comments`, {
    body,
  });

const deleteComment = (gistId: string, commentId: number): Promise<Response> =>
  client.deleteTokenRequired(
    `/gists/${encodeURIComponent(gistId)}/comments/${commentId}`,
  );

export default {
  list,
  get,
  create,
  update,
  remove,
  fork,
  star,
  unstar,
  listComments,
  createComment,
  deleteComment,
};
export type { GistInput };
