import { describe, it, expect, vi, Mock } from "vitest";

import orgs from "@/api/orgs";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    put: vi.fn(),
    delete: vi.fn(),
    getPaginated: vi.fn(),
    getDefaultPerPage: vi.fn(() => 100),
  },
}));

describe("orgs api", () => {
  it("should call client.getPaginated for listMembers", async () => {
    (client.getPaginated as Mock).mockResolvedValue([]);
    await orgs.listMembers("airscripts");

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/orgs/airscripts/members?per_page=100",
    );
  });

  it("should URL-encode org and username for listMembers", async () => {
    (client.getPaginated as Mock).mockResolvedValue([]);
    await orgs.listMembers("hello world");

    expect(client.getPaginated).toHaveBeenCalledWith(
      "/orgs/hello%20world/members?per_page=100",
    );
  });

  it("should call client.put for inviteMember", async () => {
    (client.put as Mock).mockResolvedValue({ status: 200 });
    await orgs.inviteMember("airscripts", "octocat", "admin");

    expect(client.put).toHaveBeenCalledWith(
      "/orgs/airscripts/memberships/octocat",
      { role: "admin" },
    );
  });

  it("should URL-encode username for inviteMember", async () => {
    (client.put as Mock).mockResolvedValue({ status: 200 });
    await orgs.inviteMember("airscripts", "user@domain", "admin");

    expect(client.put).toHaveBeenCalledWith(
      "/orgs/airscripts/memberships/user%40domain",
      { role: "admin" },
    );
  });

  it("should call client.delete for removeMember", async () => {
    (client.delete as Mock).mockResolvedValue({ status: 204 });
    await orgs.removeMember("airscripts", "octocat");

    expect(client.delete).toHaveBeenCalledWith(
      "/orgs/airscripts/memberships/octocat",
    );
  });
});
