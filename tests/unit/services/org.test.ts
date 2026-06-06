import api from "@/api/orgs";
import logger from "@/core/logger";
import orgService from "@/services/org";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/api/orgs", () => ({
  default: {
    listMembers: vi.fn(),
    inviteMember: vi.fn(),
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

const MEMBERS = [
  {
    id: 1,
    role: "admin",
    login: "octocat",
    site_admin: false,
    avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
  },

  {
    id: 2,
    login: "mona",
    role: "member",
    site_admin: true,
    avatar_url: "https://avatars.githubusercontent.com/u/2?v=4",
  },
];

describe("org service", () => {
  beforeEach(() => {
    vi.spyOn(logger, "start").mockImplementation(() => {});
    vi.spyOn(logger, "success").mockImplementation(() => {});
    vi.spyOn(logger, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list members", async () => {
    (api.listMembers as Mock).mockResolvedValue(MEMBERS);
    const result = await orgService.list("airscripts");

    expect(result).toEqual({
      success: true,

      metadata: [
        {
          id: 1,
          role: "admin",
          login: "octocat",
          siteAdmin: false,
          avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        },

        {
          id: 2,
          login: "mona",
          role: "member",
          siteAdmin: true,
          avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
        },
      ],
    });
  });

  it("should add member", async () => {
    (api.inviteMember as Mock).mockResolvedValue({ status: 200 });
    const result = await orgService.add("airscripts", "octocat", "admin");

    expect(result).toEqual({
      success: true,

      metadata: {
        role: "admin",
        org: "airscripts",
        username: "octocat",
      },
    });
  });

  it("should remove member", async () => {
    (api.removeMember as Mock).mockResolvedValue({ status: 204 });
    const result = await orgService.remove("airscripts", "octocat");

    expect(result).toEqual({
      success: true,

      metadata: {
        org: "airscripts",
        username: "octocat",
      },
    });
  });
});
