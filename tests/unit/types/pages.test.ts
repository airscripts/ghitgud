import { describe, it, expect } from "vitest";

import type { PagesSite, PagesBuild, PagesSource } from "@/types/pages";

describe("pages types", () => {
  it("has PagesSite type with expected fields", () => {
    const site: PagesSite = {
      url: "https://org.github.io",
      status: "built",
      htmlUrl: "https://org.github.io",
      httpsEnforced: true,
      buildType: "workflow",
    };

    expect(site.buildType).toBe("workflow");
    expect(site.httpsEnforced).toBe(true);
  });

  it("has PagesSite type with optional source", () => {
    const site: PagesSite = {
      url: "https://org.github.io",
      status: "built",
      htmlUrl: "https://org.github.io",
      httpsEnforced: false,
      buildType: "legacy",
      source: { branch: "main", path: "/docs" },
    };

    expect(site.source?.branch).toBe("main");
  });

  it("has PagesBuild type", () => {
    const build: PagesBuild = {
      url: "https://api.github.com/repos/org/repo/pages/builds/1",
      status: "completed",
    };

    expect(build.status).toBe("completed");
  });

  it("has PagesSource type", () => {
    const source: PagesSource = { branch: "gh-pages", path: "/" };
    expect(source.branch).toBe("gh-pages");
  });
});
