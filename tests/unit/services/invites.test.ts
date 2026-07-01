import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

import api from "@/api/invites";
import logger from "@/core/logger";
import invitesService from "@/services/invites";

vi.mock("@/api/invites", () => ({
  default: {
    grantTeamAccess: vi.fn(),
    inviteCollaborator: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    info: vi.fn(),
    start: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("invites service", () => {
  beforeEach(() => {
    vi.spyOn(logger, "start").mockImplementation(() => {});
    vi.spyOn(logger, "success").mockImplementation(() => {});
    vi.spyOn(logger, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should invite collaborator", async () => {
    (api.inviteCollaborator as Mock).mockResolvedValue({ status: 201 });
    const result = await invitesService.invite(
      "airscripts",
      "gitfleet",
      "octocat",
      "push",
    );

    expect(result).toEqual({
      success: true,

      metadata: {
        repo: "gitfleet",
        owner: "airscripts",
        username: "octocat",
        permission: "push",
      },
    });
  });

  it("should grant team access", async () => {
    (api.grantTeamAccess as Mock).mockResolvedValue({ status: 201 });
    const result = await invitesService.grant(
      "airscripts",
      "gitfleet",
      "ops",
      "admin",
    );

    expect(result).toEqual({
      success: true,

      metadata: {
        repo: "gitfleet",
        teamSlug: "ops",
        owner: "airscripts",
        permission: "admin",
      },
    });
  });
});
