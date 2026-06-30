import dependencies from "@/api/dependencies";
import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: { getTokenRequired: vi.fn() },
}));

describe("dependencies api", () => {
  it("fetches SBOM", () => {
    dependencies.sbom("owner/repo");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/dependency-graph/sbom",
    );
  });

  it("compares dependencies", () => {
    dependencies.compare("owner/repo", "main...feature");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/dependency-graph/compare/main...feature",
    );
  });
});
