import sshKeys from "@/api/ssh-keys";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
  },
}));

describe("ssh-keys api", () => {
  it("lists keys", () => {
    sshKeys.list();
    expect(client.getTokenRequired).toHaveBeenCalledWith("/user/keys");
  });

  it("adds a key", () => {
    sshKeys.add({ title: "test", key: "ssh-rsa AAA..." });
    expect(client.postTokenRequired).toHaveBeenCalledWith("/user/keys", {
      title: "test",
      key: "ssh-rsa AAA...",
    });
  });

  it("deletes a key", () => {
    sshKeys.delete(42);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith("/user/keys/42");
  });
});
