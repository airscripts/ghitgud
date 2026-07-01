import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    getTokenRequired: vi.fn(),
  },
}));

import licensesApi from "@/api/licenses";
import client from "@/providers/github/client";

describe("licenses api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should call GET /licenses", () => {
      licensesApi.list();
      expect(client.get).toHaveBeenCalledWith("/licenses");
    });
  });

  describe("get", () => {
    it("should call GET /licenses/:key", () => {
      licensesApi.get("mit");
      expect(client.get).toHaveBeenCalledWith("/licenses/mit");
    });
  });

  describe("repoLicense", () => {
    it("should call GET /repos/:owner/:repo/license with token", () => {
      licensesApi.repoLicense("owner/repo");
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        "/repos/owner/repo/license",
      );
    });
  });
});
