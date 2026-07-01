import { describe, it, expect, vi, beforeEach } from "vitest";

import templateService from "@/services/template";
import templateOperations from "@/tui/operations/templates";

vi.mock("@/services/template", () => ({
  default: { list: vi.fn(), show: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui template operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs template.list", async () => {
    await templateOperations[0].run({ values: {} });
    expect(templateService.list).toHaveBeenCalledWith({ repo: "owner/repo" });
  });

  it("runs template.show", async () => {
    await templateOperations[1].run({
      values: { name: "bug_report" },
    });
    expect(templateService.show).toHaveBeenCalledWith("bug_report", {
      repo: "owner/repo",
    });
  });
});
