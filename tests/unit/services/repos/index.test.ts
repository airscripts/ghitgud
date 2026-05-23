import fs from "fs";
import api from "@/api/repos";
import config from "@/core/config";
import service from "@/services/repos";
import { describe, it, expect, vi, Mock, beforeEach, afterEach } from "vitest";

vi.mock("@/core/config", () => ({
  default: {
    getRepo: vi.fn(() => "owner/default"),
  },
}));

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

vi.mock("@/api/repos", () => ({
  default: {
    fetchOrg: vi.fn(),
  },
}));

describe("repos service", () => {
  beforeEach(() => {
    vi.spyOn(config, "getRepo").mockReturnValue("owner/default");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should resolve repos from --repos", async () => {
    const result = await service.resolveTargets({
      repos: "owner/one,owner/two",
    });

    expect(result.map((repo) => repo.fullName)).toEqual([
      "owner/one",
      "owner/two",
    ]);
  });

  it("should resolve repos from --file", async () => {
    (fs.readFileSync as Mock).mockReturnValue("owner/one\nowner/two\n");
    const result = await service.resolveTargets({ file: "/tmp/repos.json" });

    expect(result.map((repo) => repo.fullName)).toEqual([
      "owner/one",
      "owner/two",
    ]);
  });

  it("should resolve repos from --org", async () => {
    (api.fetchOrg as Mock).mockResolvedValue([
      {
        id: 1,
        name: "one",
        fork: false,
        private: false,
        pushedAt: null,
        archived: false,
        fullName: "owner/one",
        defaultBranch: "main",
      },
    ]);

    const result = await service.resolveTargets({ org: "owner" });
    expect(result.map((repo) => repo.fullName)).toEqual(["owner/one"]);
  });

  it("should deduplicate repositories", async () => {
    const result = await service.resolveTargets({
      repos: "owner/one,owner/one",
    });

    expect(result).toHaveLength(1);
  });

  it("should fall back to configured repo", async () => {
    const result = await service.resolveTargets();
    expect(result.map((repo) => repo.fullName)).toEqual(["owner/default"]);
  });

  it("should apply the limit", async () => {
    const result = await service.resolveTargets({
      limit: 1,
      repos: "owner/one,owner/two",
    });

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe("owner/one");
  });
});
