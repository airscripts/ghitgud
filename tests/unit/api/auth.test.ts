import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import authApi from "@/api/auth";

const ORIGINAL_FETCH = global.fetch;

const mockFetch = () => global.fetch as ReturnType<typeof vi.fn>;

describe("auth api", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  describe("fetchAuthenticatedUser", () => {
    it("should fetch user info and parse scopes from response", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          name: "Octocat",
          login: "octocat",
          html_url: "https://github.com/octocat",
          avatar_url: "https://github.com/images/error/octocat.png",
        }),

        {
          status: 200,
          headers: {
            "X-OAuth-Scopes": "repo, read:org",
          },
        },
      );

      mockFetch().mockResolvedValue(mockResponse);
      const result = await authApi.fetchAuthenticatedUser("test-token");

      expect(result.user.login).toBe("octocat");
      expect(result.user.name).toBe("Octocat");
      expect(result.user.avatarUrl).toBe(
        "https://github.com/images/error/octocat.png",
      );

      expect(result.user.htmlUrl).toBe("https://github.com/octocat");
      expect(result.scopes).toEqual(["repo", "read:org"]);
    });

    it("should return empty scopes when header is missing", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          name: null,
          html_url: "",
          avatar_url: "",
          login: "testuser",
        }),

        {
          status: 200,
        },
      );

      mockFetch().mockResolvedValue(mockResponse);
      const result = await authApi.fetchAuthenticatedUser("test-token");

      expect(result.scopes).toEqual([]);
    });
  });
});
