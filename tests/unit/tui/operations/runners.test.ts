import { describe, it, expect, vi, beforeEach } from "vitest";

import runnerService from "@/services/runner";
import runnerOperations from "@/tui/operations/runners";

vi.mock("@/services/runner", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    status: vi.fn(),
    remove: vi.fn(),
    labels: vi.fn(),
  },
}));

describe("tui runner operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs runner.list", async () => {
    await runnerOperations[0].run({
      values: { repo: "owner/repo", org: "my-org", label: "linux" },
    });
    expect(runnerService.list).toHaveBeenCalledWith({
      repo: "owner/repo",
      org: "my-org",
      label: "linux",
    });
  });

  it("runs runner.view", async () => {
    await runnerOperations[1].run({ values: { id: 42 } });
    expect(runnerService.view).toHaveBeenCalledWith(42, {
      repo: undefined,
      org: undefined,
    });
  });

  it("runs runner.status", async () => {
    await runnerOperations[2].run({ values: { id: 42 } });
    expect(runnerService.status).toHaveBeenCalledWith(42, {
      repo: undefined,
      org: undefined,
    });
  });

  it("runs runner.remove", async () => {
    await runnerOperations[3].run({ values: { id: 42 } });
    expect(runnerService.remove).toHaveBeenCalledWith(42, {
      repo: undefined,
      org: undefined,
      yes: true,
    });
  });

  it("runs runner.labels", async () => {
    await runnerOperations[4].run({ values: { id: 42 } });
    expect(runnerService.labels).toHaveBeenCalledWith(42, {
      repo: undefined,
      org: undefined,
    });
  });
});
