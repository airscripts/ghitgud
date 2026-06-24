import { describe, it, expect, vi, beforeEach } from "vitest";

import variablesService from "@/services/variables";
import variableOperations from "@/tui/operations/variables";

vi.mock("@/services/variables", () => ({
  default: {
    list: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/core/repo", () => ({
  default: {
    resolveRepoSync: vi.fn(() => "airscripts/ghitgud"),
    resolveRepo: vi.fn(() => Promise.resolve("airscripts/ghitgud")),
  },
}));

describe("tui variable operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs variable.list", async () => {
    vi.mocked(variablesService.list).mockResolvedValue({
      success: true,
      variables: [],
    });

    const op = variableOperations.find((o) => o.id === "variable.list")!;
    await op.run({ values: {} });

    expect(variablesService.list).toHaveBeenCalledWith({
      env: undefined,
      org: undefined,
      repo: "airscripts/ghitgud",
    });
  });

  it("runs variable.set", async () => {
    vi.mocked(variablesService.set).mockResolvedValue({ success: true });
    const op = variableOperations.find((o) => o.id === "variable.set")!;
    await op.run({ values: { name: "FOO", value: "bar" } });

    expect(variablesService.set).toHaveBeenCalledWith({
      name: "FOO",
      value: "bar",
      env: undefined,
      org: undefined,
      repo: "airscripts/ghitgud",
    });
  });

  it("runs variable.delete", async () => {
    vi.mocked(variablesService.remove).mockResolvedValue({ success: true });
    const op = variableOperations.find((o) => o.id === "variable.delete")!;
    await op.run({ values: { name: "FOO" } });

    expect(variablesService.remove).toHaveBeenCalledWith({
      name: "FOO",
      env: undefined,
      org: undefined,
      repo: "airscripts/ghitgud",
    });
  });
});
