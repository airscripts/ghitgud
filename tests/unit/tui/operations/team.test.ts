import { describe, it, expect, vi, beforeEach } from "vitest";

import teamService from "@/services/team";
import teamOperations from "@/tui/operations/team";

vi.mock("@/services/team", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  },
}));

describe("tui team operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs team.list", async () => {
    await teamOperations[0].run({ values: { org: "my-org" } });
    expect(teamService.list).toHaveBeenCalledWith("my-org");
  });

  it("runs team.create", async () => {
    await teamOperations[1].run({
      values: { org: "my-org", name: "devs", description: "team desc" },
    });
    expect(teamService.create).toHaveBeenCalledWith(
      "my-org",
      "devs",
      "team desc",
      "closed",
    );
  });

  it("runs team.add", async () => {
    await teamOperations[2].run({
      values: { org: "my-org", team: "devs", user: "octocat", role: "member" },
    });
    expect(teamService.addMember).toHaveBeenCalledWith(
      "my-org",
      "devs",
      "octocat",
      "member",
    );
  });

  it("runs team.remove", async () => {
    await teamOperations[3].run({
      values: { org: "my-org", team: "devs", user: "octocat" },
    });
    expect(teamService.removeMember).toHaveBeenCalledWith(
      "my-org",
      "devs",
      "octocat",
    );
  });
});
