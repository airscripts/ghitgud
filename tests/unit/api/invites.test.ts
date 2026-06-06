import client from "@/api/client";
import invites from "@/api/invites";
import { describe, it, expect, vi, Mock } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    put: vi.fn(),
  },
}));

describe("invites api", () => {
  it("should call client.put for inviteCollaborator", async () => {
    (client.put as Mock).mockResolvedValue({ status: 201 });
    await invites.inviteCollaborator(
      "airscripts",
      "ghitgud",
      "octocat",
      "push",
    );

    expect(client.put).toHaveBeenCalledWith(
      "/repos/airscripts/ghitgud/collaborators/octocat",
      { permission: "push" },
    );
  });

  it("should call client.put for grantTeamAccess", async () => {
    (client.put as Mock).mockResolvedValue({ status: 201 });
    await invites.grantTeamAccess("airscripts", "ghitgud", "ops", "admin");

    expect(client.put).toHaveBeenCalledWith(
      "/repos/airscripts/ghitgud/teams/ops",
      { permission: "admin" },
    );
  });
});
