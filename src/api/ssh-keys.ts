import client from "./client";

const list = (): Promise<Response> => client.getTokenRequired("/user/keys");

const add = (data: { title: string; key: string }): Promise<Response> =>
  client.postTokenRequired("/user/keys", data);

const deleteKey = (id: number): Promise<Response> =>
  client.deleteTokenRequired(`/user/keys/${id}`);

export default { list, add, delete: deleteKey };
