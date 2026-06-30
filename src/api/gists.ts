import client from "./client";

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

export default { list, get, create, update, remove };
export type { GistInput };
