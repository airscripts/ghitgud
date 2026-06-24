import { describe, it, expect, vi, beforeEach } from "vitest";

import secretsService from "@/services/secrets";
import secretOperations from "@/tui/operations/secrets";

vi.mock("@/services/secrets", () => ({
  default: {
    set: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepoSync: vi.fn(() => "airscripts/ghitgud"),
    resolveRepo: vi.fn(() => Promise.resolve("airscripts/ghitgud")),
  },
}));

describe("tui secret operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs secret.list", async () => {
    vi.mocked(secretsService.list).mockResolvedValue({
      secrets: [],
      success: true,
    });

    const op = secretOperations.find((o) => o.id === "secret.list")!;
    await op.run({ values: {} });

    expect(secretsService.list).toHaveBeenCalledWith({
      env: undefined,
      org: undefined,
      repo: "airscripts/ghitgud",
    });
  });

  it("runs secret.set", async () => {
    vi.mocked(secretsService.set).mockResolvedValue({ success: true });

    const op = secretOperations.find((o) => o.id === "secret.set")!;
    await op.run({
      values: {
        name: "FOO",
        value: "bar",
        visibility: "all",
      },
    });

    expect(secretsService.set).toHaveBeenCalledWith({
      name: "FOO",
      value: "bar",
      env: undefined,
      org: undefined,
      repos: undefined,
      visibility: "all",
      repo: "airscripts/ghitgud",
    });
  });

  it("runs secret.delete", async () => {
    vi.mocked(secretsService.remove).mockResolvedValue({ success: true });
    const op = secretOperations.find((o) => o.id === "secret.delete")!;
    await op.run({ values: { name: "FOO" } });

    expect(secretsService.remove).toHaveBeenCalledWith({
      name: "FOO",
      env: undefined,
      org: undefined,
      repo: "airscripts/ghitgud",
    });
  });
});
