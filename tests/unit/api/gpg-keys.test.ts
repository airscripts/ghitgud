import gpgKeys from "@/api/gpg-keys";
import client from "@/providers/github/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
  },
}));

describe("gpg-keys api", () => {
  it("lists keys", () => {
    gpgKeys.list();
    expect(client.getTokenRequired).toHaveBeenCalledWith("/user/gpg_keys");
  });

  it("adds a key", () => {
    gpgKeys.add({ armored_public_key: "-----BEGIN PGP-----" });
    expect(client.postTokenRequired).toHaveBeenCalledWith("/user/gpg_keys", {
      armored_public_key: "-----BEGIN PGP-----",
    });
  });

  it("deletes a key", () => {
    gpgKeys.delete(42);
    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/user/gpg_keys/42",
    );
  });
});
