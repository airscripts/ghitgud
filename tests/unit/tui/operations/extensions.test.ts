import { describe, it, expect, vi, beforeEach } from "vitest";

import extensionService from "@/services/extension";
import extensionOperations from "@/tui/operations/extensions";

vi.mock("@/services/extension", () => ({
  default: {
    list: vi.fn(),
    install: vi.fn(),
    remove: vi.fn(),
    upgrade: vi.fn(),
    create: vi.fn(),
    exec: vi.fn(),
  },
}));

describe("tui extension operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs extension.list", async () => {
    await extensionOperations[0].run({ values: {} });
    expect(extensionService.list).toHaveBeenCalled();
  });

  it("runs extension.install", async () => {
    await extensionOperations[1].run({
      values: { repo: "owner/ghg-ext" },
    });
    expect(extensionService.install).toHaveBeenCalledWith("owner/ghg-ext");
  });

  it("runs extension.remove", async () => {
    await extensionOperations[2].run({ values: { name: "ghg-ext" } });
    expect(extensionService.remove).toHaveBeenCalledWith("ghg-ext");
  });

  it("runs extension.upgrade", async () => {
    await extensionOperations[3].run({ values: { name: "ghg-ext" } });
    expect(extensionService.upgrade).toHaveBeenCalledWith("ghg-ext");
  });

  it("runs extension.create", async () => {
    await extensionOperations[4].run({ values: { name: "ghg-new" } });
    expect(extensionService.create).toHaveBeenCalledWith("ghg-new");
  });

  it("runs extension.exec", async () => {
    await extensionOperations[5].run({
      values: { name: "ghg-ext", args: "foo bar" },
    });
    expect(extensionService.exec).toHaveBeenCalledWith("ghg-ext", [
      "foo",
      "bar",
    ]);
  });
});
