import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/api/client";
import environments from "@/api/environments";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    putTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("environments api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists environments", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response("{}"));
    await environments.list("owner", "repo");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/environments?per_page=100",
    );
  });

  it("creates environment", async () => {
    vi.mocked(client.putTokenRequired).mockResolvedValue(new Response("{}"));
    await environments.create("owner", "repo", "prod", 42);

    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/environments/prod",
      { wait_timer: 42 },
    );
  });

  it("lists protection rules", async () => {
    vi.mocked(client.get).mockResolvedValue(new Response("[]"));
    await environments.listProtectionRules("owner", "repo", "prod");

    expect(client.get).toHaveBeenCalledWith(
      "/repos/owner/repo/environments/prod/deployment_protection_rules",
    );
  });

  it("adds protection rule", async () => {
    vi.mocked(client.postTokenRequired).mockResolvedValue(new Response("{}"));
    await environments.addProtectionRule(
      "owner",
      "repo",
      "prod",
      "wait_timer",
      {
        wait_timer: 30,
      },
    );

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/environments/prod/deployment_protection_rules",
      { type: "wait_timer", wait_timer: 30 },
    );
  });

  it("removes protection rule", async () => {
    vi.mocked(client.deleteTokenRequired).mockResolvedValue(new Response("{}"));
    await environments.removeProtectionRule("owner", "repo", "prod", 1);

    expect(client.deleteTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/environments/prod/deployment_protection_rules/1",
    );
  });
});
