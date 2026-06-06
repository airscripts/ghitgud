import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import releaseCommand from "@/commands/release";

vi.mock("@/services/release", () => ({
  default: {
    bump: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    notes: vi.fn(() => Promise.resolve({ success: true, metadata: "" })),
    draft: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    verify: vi.fn(() => Promise.resolve({ success: true, metadata: {} })),
    changelog: vi.fn(() => Promise.resolve({ success: true, metadata: [] })),
  },
}));

import releaseService from "@/services/release";

describe("integration > release commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("changelog calls service with since and to", async () => {
    const program = new Command();
    program.exitOverride();
    releaseCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "release",
      "changelog",
      "--since",
      "v2.0.0",
      "--to",
      "HEAD",
    ]);

    expect(releaseService.changelog).toHaveBeenCalledWith({
      to: "HEAD",
      since: "v2.0.0",
    });
  });

  it("bump calls service with level, create, and push", async () => {
    const program = new Command();
    program.exitOverride();
    releaseCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "release",
      "bump",
      "--level",
      "minor",
      "--create",
      "--push",
    ]);

    expect(releaseService.bump).toHaveBeenCalledWith({
      push: true,
      create: true,
      level: "minor",
    });
  });

  it("verify calls service with tag", async () => {
    const program = new Command();
    program.exitOverride();
    releaseCommand.register(program);

    await program.parseAsync(["node", "test", "release", "verify", "v2.10.0"]);
    expect(releaseService.verify).toHaveBeenCalledWith("v2.10.0", {});
  });

  it("notes calls service with template, since, and out", async () => {
    const program = new Command();
    program.exitOverride();
    releaseCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "release",
      "notes",
      "--template",
      "custom.md",
      "--since",
      "v2.0.0",
      "--out",
      "notes.md",
    ]);

    expect(releaseService.notes).toHaveBeenCalledWith({
      since: "v2.0.0",
      out: "notes.md",
      templateFile: "custom.md",
    });
  });

  it("draft calls service with level, title, and notes", async () => {
    const program = new Command();
    program.exitOverride();
    releaseCommand.register(program);

    await program.parseAsync([
      "node",
      "test",
      "release",
      "draft",
      "--level",
      "minor",
      "--title",
      "v2.11.0",
      "--notes",
      "generated",
    ]);

    expect(releaseService.draft).toHaveBeenCalledWith({
      level: "minor",
      title: "v2.11.0",
      notes: "generated",
    });
  });
});
