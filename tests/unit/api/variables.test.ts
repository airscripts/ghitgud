import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/api/client";
import variables from "@/api/variables";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    postTokenRequired: vi.fn(),
    patchTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("variables api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists repo variables", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response("{}"));
    await variables.listRepo("owner", "repo");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/variables?per_page=100",
    );
  });

  it("lists org variables", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response("{}"));
    await variables.listOrg("my-org");

    expect(client.get).toHaveBeenCalledWith(
      "/orgs/my-org/actions/variables?per_page=100",
    );
  });

  it("lists environment variables", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response("{}"));
    await variables.listEnv("owner", "repo", "prod");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/environments/prod/variables?per_page=100",
    );
  });

  it("sets repo variable", async () => {
    vi.mocked(client.postTokenRequired).mockResolvedValue(new Response("{}"));
    await variables.setRepo("owner", "repo", "FOO", "bar");

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/variables",
      { name: "FOO", value: "bar" },
    );
  });

  it("updates repo variable", async () => {
    vi.mocked(client.patchTokenRequired).mockResolvedValue(new Response("{}"));
    await variables.updateRepo("owner", "repo", "FOO", "bar");

    expect(client.patchTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/variables/FOO",
      { name: "FOO", value: "bar" },
    );
  });

  it("deletes repo variable", async () => {
    vi.mocked(client.deleteTokenRequired).mockResolvedValue(new Response("{}"));
    await variables.deleteRepo("owner", "repo", "FOO");

    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/actions/variables/FOO",
    );
  });
});
