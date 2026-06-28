import { beforeEach, describe, expect, it, vi } from "vitest";

import wikiService from "@/services/wiki";
import wikiOperations from "@/tui/operations/wiki";

vi.mock("@/services/wiki", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    edit: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(async () => "owner/repo") },
}));

describe("tui wiki operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registers and runs all operations", async () => {
    expect(wikiOperations.map((operation) => operation.id)).toEqual([
      "wiki.list",
      "wiki.view",
      "wiki.edit",
      "wiki.create",
      "wiki.delete",
    ]);

    await wikiOperations[0].run({ values: { repo: "owner/repo" } });
    await wikiOperations[1].run({
      values: { repo: "owner/repo", page: "Home" },
    });

    await wikiOperations[2].run({
      values: { repo: "owner/repo", page: "Home", file: "home.md" },
    });

    await wikiOperations[3].run({
      values: { repo: "owner/repo", page: "FAQ", file: "faq.md" },
    });

    await wikiOperations[4].run({
      values: { repo: "owner/repo", page: "OldPage" },
    });

    expect(wikiService.list).toHaveBeenCalledWith("owner/repo");
    expect(wikiService.view).toHaveBeenCalledWith("owner/repo", "Home");

    expect(wikiService.edit).toHaveBeenCalledWith(
      "owner/repo",
      "Home",
      "home.md",
    );

    expect(wikiService.create).toHaveBeenCalledWith(
      "owner/repo",
      "FAQ",
      "faq.md",
    );

    expect(wikiService.delete).toHaveBeenCalledWith("owner/repo", "OldPage");
  });
});
