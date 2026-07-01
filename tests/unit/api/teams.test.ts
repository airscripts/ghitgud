import { describe, it, expect, vi, Mock } from "vitest";

import teams from "@/api/teams";
import client from "@/providers/github/client";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    getPaginated: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("teams api", () => {
  it("should call client.get for list", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await teams.list("airscripts");

    expect(client.get).toHaveBeenCalledWith(
      "/orgs/airscripts/teams?per_page=100",
    );
  });

  it("should URL-encode org for list", async () => {
    (client.get as Mock).mockResolvedValue({ status: 200 });
    await teams.list("hello world");

    expect(client.get).toHaveBeenCalledWith(
      "/orgs/hello%20world/teams?per_page=100",
    );
  });

  it("should call client.post for create", async () => {
    (client.post as Mock).mockResolvedValue({ status: 201 });
    await teams.create("airscripts", "ops", "Platform team", "secret");

    expect(client.post).toHaveBeenCalledWith("/orgs/airscripts/teams", {
      name: "ops",
      privacy: "secret",
      description: "Platform team",
    });
  });

  it("should URL-encode org for create", async () => {
    (client.post as Mock).mockResolvedValue({ status: 201 });
    await teams.create("hello world", "ops", "Platform team", "secret");

    expect(client.post).toHaveBeenCalledWith("/orgs/hello%20world/teams", {
      name: "ops",
      privacy: "secret",
      description: "Platform team",
    });
  });

  it("should call client.getPaginated for listMembers", async () => {
    (client.getPaginated as Mock).mockResolvedValue([]);
    await teams.listMembers("airscripts", "ops");

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/orgs/airscripts/teams/ops/members?per_page=100",
    );
  });

  it("should URL-encode teamSlug for listMembers", async () => {
    (client.getPaginated as Mock).mockResolvedValue([]);
    await teams.listMembers("airscripts", "hello+world");

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/orgs/airscripts/teams/hello%2Bworld/members?per_page=100",
    );
  });

  it("should call client.put for addMember", async () => {
    (client.put as Mock).mockResolvedValue({ status: 200 });
    await teams.addMember("airscripts", "ops", "octocat", "maintainer");

    expect(client.put).toHaveBeenCalledWith(
      "/orgs/airscripts/teams/ops/memberships/octocat",
      { role: "maintainer" },
    );
  });

  it("should URL-encode username for addMember", async () => {
    (client.put as Mock).mockResolvedValue({ status: 200 });
    await teams.addMember("airscripts", "ops", "user@domain", "maintainer");

    expect(client.put).toHaveBeenCalledWith(
      "/orgs/airscripts/teams/ops/memberships/user%40domain",
      { role: "maintainer" },
    );
  });

  it("should call client.delete for removeMember", async () => {
    (client.delete as Mock).mockResolvedValue({ status: 204 });
    await teams.removeMember("airscripts", "ops", "octocat");

    expect(client.delete).toHaveBeenCalledWith(
      "/orgs/airscripts/teams/ops/memberships/octocat",
    );
  });
});
