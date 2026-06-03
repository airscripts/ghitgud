import { describe, it, expect } from "vitest";
import { contentsPath, repoPath, repoRoot, segment } from "@/api/path";

describe("api path helpers", () => {
  it("encodes individual path segments", () => {
    expect(segment("needs review/a+b")).toBe("needs%20review%2Fa%2Bb");
  });

  it("builds repository paths without encoding owner/repo as one segment", () => {
    expect(repoRoot("owner/repo")).toBe("/repos/owner/repo");
    expect(repoPath("owner/repo", "labels", "needs review")).toBe(
      "/repos/owner/repo/labels/needs%20review",
    );
  });

  it("builds contents paths while preserving path separators", () => {
    expect(contentsPath("owner/repo", "docs/API #1.md")).toBe(
      "/repos/owner/repo/contents/docs/API%20%231.md",
    );
  });
});
