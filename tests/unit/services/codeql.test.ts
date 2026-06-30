import api from "@/api/codeql";
import codeqlService from "@/services/codeql";
import { describe, expect, it, vi, beforeEach, Mock } from "vitest";

vi.mock("@/api/codeql", () => ({
  default: { list: vi.fn(), get: vi.fn(), update: vi.fn() },
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

describe("codeql service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists alerts", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve([
          {
            number: 1,
            rule: { description: "SQL injection", severity: "high" },
            state: "open",
            tool: { name: "CodeQL" },
            created_at: "2026-01-01",
          },
        ]),
    });
    const result = await codeqlService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(api.list).toHaveBeenCalledWith("owner/repo", {});
  });

  it("lists alerts with filters", async () => {
    (api.list as Mock).mockResolvedValue({ json: () => Promise.resolve([]) });
    const result = await codeqlService.list({
      repo: "owner/repo",
      state: "open",
      severity: "high",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid state", async () => {
    await expect(codeqlService.list({ state: "invalid" })).rejects.toThrow(
      "Invalid state",
    );
  });

  it("rejects invalid severity", async () => {
    await expect(codeqlService.list({ severity: "invalid" })).rejects.toThrow(
      "Invalid severity",
    );
  });

  it("views an alert", async () => {
    (api.get as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          number: 1,
          rule: { description: "SQL injection", id: "sql/injection" },
          severity: "high",
          state: "open",
          tool: { name: "CodeQL" },
          html_url: "https://github.com/...",
          created_at: "2026-01-01",
        }),
    });
    const result = await codeqlService.view({ alertNumber: 1 });
    expect(result.success).toBe(true);
  });

  it("dismisses an alert", async () => {
    (api.update as Mock).mockResolvedValue({
      json: () => Promise.resolve({ number: 1, state: "dismissed" }),
    });
    const result = await codeqlService.dismiss({
      alertNumber: 1,
      reason: "false positive",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid dismiss reason", async () => {
    await expect(
      codeqlService.dismiss({ alertNumber: 1, reason: "invalid" }),
    ).rejects.toThrow("Invalid dismiss reason");
  });
});
