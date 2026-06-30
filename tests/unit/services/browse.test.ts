import { describe, expect, it, vi } from "vitest";
import browseService from "@/services/browse";

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

describe("browse service", () => {
  it("builds repo URL", () => {
    const url = browseService.buildRepoUrl("owner/repo");
    expect(url).toBe("https://github.com/owner/repo");
  });

  it("builds repo URL with path", () => {
    const url = browseService.buildRepoUrl("owner/repo", {
      path: "src/index.ts",
    });
    expect(url).toContain("src/index.ts");
  });

  it("builds issues URL", () => {
    const url = browseService.buildIssuesUrl("owner/repo");
    expect(url).toContain("/issues");
  });

  it("builds number URL", () => {
    const url = browseService.buildNumberUrl("owner/repo", 42);
    expect(url).toContain("/issues/42");
  });
});
