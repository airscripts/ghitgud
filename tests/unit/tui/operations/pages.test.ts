import { beforeEach, describe, expect, it, vi } from "vitest";

import pagesService from "@/services/pages";
import pagesOperations from "@/tui/operations/pages";

vi.mock("@/services/pages", () => ({
  default: { status: vi.fn(), deploy: vi.fn(), unpublish: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui Pages operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registers and runs all operations", async () => {
    expect(pagesOperations.map((operation) => operation.id)).toEqual([
      "pages.status",
      "pages.deploy",
      "pages.unpublish",
    ]);

    await pagesOperations[0].run({ values: { repo: "owner/repo" } });
    await pagesOperations[1].run({
      values: { repo: "owner/repo", source: "main", path: "/docs" },
    });

    await pagesOperations[2].run({ values: { repo: "owner/repo" } });
    expect(pagesService.status).toHaveBeenCalledWith("owner/repo");

    expect(pagesService.deploy).toHaveBeenCalledWith("owner/repo", {
      source: "main",
      path: "/docs",
    });

    expect(pagesService.unpublish).toHaveBeenCalledWith("owner/repo");
  });
});
