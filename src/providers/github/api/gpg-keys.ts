import client from "@/providers/github/client";

const list = (): Promise<Response> => client.getTokenRequired("/user/gpg_keys");

const add = (data: { armored_public_key: string }): Promise<Response> =>
  client.postTokenRequired("/user/gpg_keys", data);

const deleteKey = (id: number): Promise<Response> =>
  client.deleteTokenRequired(`/user/gpg_keys/${id}`);

export default { list, add, delete: deleteKey };
