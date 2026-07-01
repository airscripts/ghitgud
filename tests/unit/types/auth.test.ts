import { describe, it, expect } from "vitest";

import type { AuthUser, AuthStatus } from "@/types/auth";

describe("auth types", () => {
  it("has AuthUser type with expected fields", () => {
    const user: AuthUser = {
      login: "octocat",
      htmlUrl: "https://github.com/octocat",
      avatarUrl: "https://github.com/octocat.png",
      name: null,
    };

    expect(user.login).toBe("octocat");
    expect(user.name).toBeNull();
  });

  it("has AuthStatus type with expected fields", () => {
    const status: AuthStatus = {
      user: {
        login: "octocat",
        htmlUrl: "https://github.com/octocat",
        avatarUrl: "https://github.com/octocat.png",
        name: null,
      },
      scopes: ["repo", "read:org"],
    };

    expect(status.scopes).toEqual(["repo", "read:org"]);
  });
});
