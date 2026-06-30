import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import sshKeyService from "@/services/ssh-key";

vi.mock("@/api/ssh-keys", () => ({
  default: { list: vi.fn(), add: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

import api from "@/api/ssh-keys";

describe("ssh-key service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists ssh keys", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    const result = await sshKeyService.list();
    expect(result.success).toBe(true);
  });

  it("adds an ssh key", async () => {
    (api.add as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 1,
          title: "test",
          key: "ssh-rsa AAA",
          created_at: "2026-01-01",
        }),
    });
    const result = await sshKeyService.add({
      title: "test",
      key: "ssh-rsa AAA",
    });
    expect(result.success).toBe(true);
  });

  it("rejects add without key or file", async () => {
    await expect(sshKeyService.add({ title: "test" })).rejects.toThrow(
      "Either --key or --file is required",
    );
  });

  it("deletes an ssh key with --yes", async () => {
    (api.delete as Mock).mockResolvedValue({ ok: true });
    const result = await sshKeyService.delete(1, { yes: true });
    expect(result.success).toBe(true);
  });

  it("rejects delete without --yes", async () => {
    await expect(sshKeyService.delete(1)).rejects.toThrow("--yes");
  });
});
