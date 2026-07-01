import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/client", () => ({
  default: {
    getTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
  },
}));

import skillApi from "@/api/skill";
import client from "@/api/client";

describe("skill api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("search", () => {
    it("should call GET /copilot/skills/search", () => {
      skillApi.search("testing");
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        "/copilot/skills/search?q=testing",
      );
    });
  });

  describe("getSkill", () => {
    it("should call GET /repos/:repo/copilot-skills", () => {
      skillApi.getSkill("owner/repo");
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        "/repos/owner/repo/copilot-skills",
      );
    });

    it("should call GET /repos/:repo/copilot-skills/:skill with skill name", () => {
      skillApi.getSkill("owner/repo", "my-skill");
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        "/repos/owner/repo/copilot-skills/my-skill",
      );
    });
  });

  describe("publish", () => {
    it("should call POST /repos/:repo/copilot-skills", () => {
      skillApi.publish("owner/repo", { name: "test" });
      expect(client.postTokenRequired).toHaveBeenCalledWith(
        "/repos/owner/repo/copilot-skills",
        { name: "test" },
      );
    });
  });
});
