import client from "@/api/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: { getTokenRequired: vi.fn() },
}));

describe("templates api", () => {
  it("calls list endpoint", () => {
    import("@/api/templates").then(({ default: templates }) => {
      templates.list("owner/repo");
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        expect.stringContaining(
          "/repos/owner/repo/contents/.github/ISSUE_TEMPLATE",
        ),
      );
    });
  });

  it("calls get endpoint", () => {
    import("@/api/templates").then(({ default: templates }) => {
      templates.get("owner/repo", ".github/ISSUE_TEMPLATE/bug_report.yml");
      expect(client.getTokenRequired).toHaveBeenCalledWith(
        expect.stringContaining("/repos/owner/repo/contents/.github"),
      );
    });
  });
});
