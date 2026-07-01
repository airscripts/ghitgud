import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/providers/github/client";
import secrets from "@/api/secrets";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    getTokenRequired: vi.fn(),
    putTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("secrets api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists repo secrets", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response("{}"));
    await secrets.listRepo("owner", "repo");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/secrets?per_page=100",
    );
  });

  it("lists org secrets", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response("{}"));
    await secrets.listOrg("my-org");

    expect(client.get).toHaveBeenCalledWith(
      "/orgs/my-org/actions/secrets?per_page=100",
    );
  });

  it("lists environment secrets", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response("{}"));
    await secrets.listEnv("owner", "repo", "prod");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/environments/prod/secrets?per_page=100",
    );
  });

  it("gets repo public key", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue(new Response("{}"));
    await secrets.getRepoPublicKey("owner", "repo");

    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/secrets/public-key",
    );
  });

  it("sets repo secret", async () => {
    vi.mocked(client.putTokenRequired).mockResolvedValue(new Response("{}"));
    await secrets.setRepo("owner", "repo", "FOO", "enc", "key-1");

    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/secrets/FOO",
      { encrypted_value: "enc", key_id: "key-1" },
    );
  });

  it("sets org secret", async () => {
    vi.mocked(client.putTokenRequired).mockResolvedValue(new Response("{}"));
    await secrets.setOrg("my-org", "FOO", "enc", "key-1", "all");

    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/orgs/my-org/actions/secrets/FOO",
      { encrypted_value: "enc", key_id: "key-1", visibility: "all" },
    );
  });

  it("deletes repo secret", async () => {
    vi.mocked(client.deleteTokenRequired).mockResolvedValue(new Response("{}"));
    await secrets.deleteRepo("owner", "repo", "FOO");

    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/secrets/FOO",
    );
  });
});
