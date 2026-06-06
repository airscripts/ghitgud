import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import reposCommand from "@/commands/repos";

vi.mock("@/services/repos/inspect", () => ({
  default: {
    inspect: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

vi.mock("@/services/repos/govern", () => ({
  default: {
    govern: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

vi.mock("@/services/repos/label", () => ({
  default: {
    label: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

vi.mock("@/services/repos/retire", () => ({
  default: {
    retire: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

vi.mock("@/services/repos/report", () => ({
  default: {
    report: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
  },
}));

import labelService from "@/services/repos/label";
import governService from "@/services/repos/govern";
import retireService from "@/services/repos/retire";
import reportService from "@/services/repos/report";
import inspectService from "@/services/repos/inspect";

describe("integration > repos commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inspect calls service with target options", async () => {
    const program = new Command();
    program.exitOverride();
    reposCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repos",
      "inspect",
      "--org",
      "airscripts",
      "--limit",
      "20",
    ]);

    expect(inspectService.inspect).toHaveBeenCalledWith({
      limit: "20",
      org: "airscripts",
    });
  });

  it("govern calls service with ruleset and flags", async () => {
    const program = new Command();
    program.exitOverride();
    reposCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repos",
      "govern",
      "--org",
      "airscripts",
      "--ruleset",
      "./ruleset.json",
      "--dry-run",
      "--yes",
    ]);

    expect(governService.govern).toHaveBeenCalledWith({
      yes: true,
      dryRun: true,
      org: "airscripts",
      ruleset: "./ruleset.json",
    });
  });

  it("label calls service with template and metadata", async () => {
    const program = new Command();
    program.exitOverride();
    reposCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repos",
      "label",
      "--org",
      "airscripts",
      "-t",
      "conventional",
      "--metadata",
      "./labels.json",
      "--dry-run",
    ]);

    expect(labelService.label).toHaveBeenCalledWith({
      yes: false,
      dryRun: true,
      org: "airscripts",
      template: "conventional",
      metadata: "./labels.json",
    });
  });

  it("retire calls service with months and include flags", async () => {
    const program = new Command();
    program.exitOverride();
    reposCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repos",
      "retire",
      "--org",
      "airscripts",
      "--months",
      "6",
      "--include-forks",
      "--include-private",
      "--yes",
    ]);

    expect(retireService.retire).toHaveBeenCalledWith({
      yes: true,
      months: "6",
      dryRun: false,
      org: "airscripts",
      includeForks: true,
      includePrivate: true,
    });
  });

  it("report calls service with since option", async () => {
    const program = new Command();
    program.exitOverride();
    reposCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "repos",
      "report",
      "--org",
      "airscripts",
      "--since",
      "30d",
    ]);

    expect(reportService.report).toHaveBeenCalledWith({
      since: "30d",
      org: "airscripts",
    });
  });
});
