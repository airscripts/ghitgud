import codeApi from "@/api/code";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: { getTokenRequired: vi.fn() },
}));

describe("code api", () => {
  it("calls search endpoint", () => {
    codeApi.search("test", { repo: "owner/repo" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/search/code"),
    );
  });

  it("calls definitions endpoint", () => {
    codeApi.definitions("main", { repo: "owner/repo" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/search/code"),
    );
  });

  it("calls references endpoint", () => {
    codeApi.references("import", { repo: "owner/repo" });
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/search/code"),
    );
  });

  it("calls file contents endpoint", () => {
    codeApi.fileContents("owner/repo", "README.md");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/contents/README.md"),
    );
  });

  it("calls blame commits endpoint", () => {
    codeApi.blameCommits("owner/repo", "src/index.ts");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      expect.stringContaining("/repos/owner/repo/commits"),
    );
  });

  it("calls commit PRs endpoint", () => {
    codeApi.commitPRs("owner/repo", "abc123");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/commits/abc123/pulls",
    );
  });
});
