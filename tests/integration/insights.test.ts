import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import insightsCommand from "@/commands/analytics-repo";

vi.mock("@/services/insights", () => ({
  default: {
    formatCommits: vi.fn(),
    formatTraffic: vi.fn(),
    formatPopularity: vi.fn(),
    formatContributors: vi.fn(),
    formatCodeFrequency: vi.fn(),
    commits: vi.fn(() => Promise.resolve([])),
    contributors: vi.fn(() => Promise.resolve([])),
    codeFrequency: vi.fn(() => Promise.resolve([])),
    traffic: vi.fn(() => Promise.resolve({ views: 100, clones: 50 })),
    popularity: vi.fn(() => Promise.resolve({ referrers: [], paths: [] })),

    participation: vi.fn(() =>
      Promise.resolve({ allTime: [1, 2], ownerTime: [1, 1] }),
    ),
  },
}));

import insightsService from "@/services/insights";

describe("integration > insights commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("traffic calls service with --repo", async () => {
    const program = new Command();
    program.exitOverride();
    insightsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "analytics",
      "repo",
      "traffic",
      "--repo",
      "owner/repo",
    ]);

    expect(insightsService.traffic).toHaveBeenCalledWith("owner/repo");
  });

  it("contributors calls service with --repo", async () => {
    const program = new Command();
    program.exitOverride();
    insightsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "analytics",
      "repo",
      "contributors",
      "--repo",
      "owner/repo",
    ]);

    expect(insightsService.contributors).toHaveBeenCalledWith("owner/repo");
  });

  it("commits calls service with --repo", async () => {
    const program = new Command();
    program.exitOverride();
    insightsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "analytics",
      "repo",
      "commits",
      "--repo",
      "owner/repo",
    ]);

    expect(insightsService.commits).toHaveBeenCalledWith("owner/repo");
  });

  it("frequency calls service with --repo", async () => {
    const program = new Command();
    program.exitOverride();
    insightsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "analytics",
      "repo",
      "frequency",
      "--repo",
      "owner/repo",
    ]);

    expect(insightsService.codeFrequency).toHaveBeenCalledWith("owner/repo");
  });

  it("popularity calls service with --repo", async () => {
    const program = new Command();
    program.exitOverride();
    insightsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "analytics",
      "repo",
      "popularity",
      "--repo",
      "owner/repo",
    ]);

    expect(insightsService.popularity).toHaveBeenCalledWith("owner/repo");
  });

  it("participation calls service with --repo", async () => {
    const program = new Command();
    program.exitOverride();
    insightsCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "analytics",
      "repo",
      "participation",
      "--repo",
      "owner/repo",
    ]);

    expect(insightsService.participation).toHaveBeenCalledWith("owner/repo");
  });
});
