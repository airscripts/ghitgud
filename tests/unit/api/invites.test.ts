import client from "@/providers/github/client";
import invites from "@/api/invites";
import { describe, it, expect, vi, Mock } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    put: vi.fn(),
  },
}));

describe("invites api", () => {
  it("should call client.put for inviteCollaborator", async () => {
    (client.put as Mock).mockResolvedValue({ status: 201 });
    await invites.inviteCollaborator(
      "airscripts",
      "gitfleet",
      "octocat",
      "push",
    );

    expect(client.put).toHaveBeenCalledWith(
      "/repos/airscripts/gitfleet/collaborators/octocat",
      { permission: "push" },
    );
  });

  it("should call client.put for grantTeamAccess", async () => {
    (client.put as Mock).mockResolvedValue({ status: 201 });
    await invites.grantTeamAccess("airscripts", "gitfleet", "ops", "admin");

    expect(client.put).toHaveBeenCalledWith(
      "/repos/airscripts/gitfleet/teams/ops",
      { permission: "admin" },
    );
  });
});
