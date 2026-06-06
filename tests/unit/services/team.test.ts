import api from "@/api/teams";
import logger from "@/core/logger";
import teamService from "@/services/team";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/api/teams", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    addMember: vi.fn(),
    listMembers: vi.fn(),
    removeMember: vi.fn(),
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

const TEAMS = [
  {
    id: 1,
    name: "ops",
    slug: "ops",
    privacy: "secret",
    description: "Platform team",
  },
];

const TEAM_MEMBERS = [
  {
    id: 1,
    login: "octocat",
    role: "maintainer",
  },
];

describe("team service", () => {
  beforeEach(() => {
    vi.spyOn(logger, "start").mockImplementation(() => {});
    vi.spyOn(logger, "success").mockImplementation(() => {});
    vi.spyOn(logger, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list teams", async () => {
    const mockResponse = { json: () => Promise.resolve(TEAMS) };
    (api.list as Mock).mockResolvedValue(mockResponse);
    const result = await teamService.list("airscripts");

    expect(result).toEqual({
      success: true,

      metadata: [
        {
          id: 1,
          name: "ops",
          slug: "ops",
          privacy: "secret",
          description: "Platform team",
        },
      ],
    });
  });

  it("should create team", async () => {
    const mockResponse = { json: () => Promise.resolve(TEAMS[0]) };
    (api.create as Mock).mockResolvedValue(mockResponse);
    const result = await teamService.create(
      "airscripts",
      "ops",
      "Platform team",
      "secret",
    );

    expect(result).toEqual({
      success: true,

      metadata: {
        id: 1,
        name: "ops",
        slug: "ops",
        privacy: "secret",
        description: "Platform team",
      },
    });
  });

  it("should list team members", async () => {
    (api.listMembers as Mock).mockResolvedValue(TEAM_MEMBERS);
    const result = await teamService.listMembers("airscripts", "ops");

    expect(result).toEqual({
      success: true,

      metadata: [
        {
          id: 1,
          login: "octocat",
          role: "maintainer",
        },
      ],
    });
  });

  it("should add member to team", async () => {
    (api.addMember as Mock).mockResolvedValue({ status: 200 });
    const result = await teamService.addMember(
      "airscripts",
      "ops",
      "octocat",
      "maintainer",
    );

    expect(result).toEqual({
      success: true,

      metadata: {
        teamSlug: "ops",
        org: "airscripts",
        role: "maintainer",
        username: "octocat",
      },
    });
  });

  it("should remove member from team", async () => {
    (api.removeMember as Mock).mockResolvedValue({ status: 204 });
    const result = await teamService.removeMember(
      "airscripts",
      "ops",
      "octocat",
    );

    expect(result).toEqual({
      success: true,

      metadata: {
        teamSlug: "ops",
        org: "airscripts",
        username: "octocat",
      },
    });
  });
});
