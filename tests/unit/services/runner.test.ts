import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import runnerService from "@/services/runner";

vi.mock("@/api/runners", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    labels: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    guardNonInteractive: vi.fn(),
    confirm: vi.fn().mockResolvedValue(true),
  },
}));

import api from "@/api/runners";

describe("runner service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists runners", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          total_count: 1,
          runners: [
            {
              id: 1,
              name: "my-runner",
              os: "linux",
              status: "online",
              busy: false,
              labels: [{ name: "self-hosted" }],
            },
          ],
        }),
    });
    const result = await runnerService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("rejects both repo and org", async () => {
    await expect(
      runnerService.list({ repo: "owner/repo", org: "myorg" }),
    ).rejects.toThrow("Use either --repo or --org");
  });

  it("views a runner", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 1,
          name: "my-runner",
          os: "linux",
          status: "online",
          busy: false,
          labels: [{ name: "self-hosted" }],
        }),
    });
    const result = await runnerService.view(1, { repo: "owner/repo" });
    expect(result.success).toBe(true);
  });

  it("removes a runner with --yes", async () => {
    (api.remove as Mock).mockResolvedValue({ ok: true });
    const result = await runnerService.remove(1, {
      repo: "owner/repo",
      yes: true,
    });
    expect(result.success).toBe(true);
  });
});
