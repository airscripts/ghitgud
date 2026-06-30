import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import gpgKeyService from "@/services/gpg-key";

vi.mock("@/api/gpg-keys", () => ({
  default: { list: vi.fn(), add: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

import api from "@/api/gpg-keys";

describe("gpg-key service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists gpg keys", async () => {
    (api.list as Mock).mockResolvedValue({
      json: () => Promise.resolve([]),
    });
    const result = await gpgKeyService.list();
    expect(result.success).toBe(true);
  });

  it("adds a gpg key", async () => {
    (api.add as Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          id: 1,
          name: "test-key",
          key_id: "ABC123",
          created_at: "2026-01-01",
        }),
    });
    const result = await gpgKeyService.add({ key: "-----BEGIN PGP-----" });
    expect(result.success).toBe(true);
  });

  it("rejects add without key or file", async () => {
    await expect(gpgKeyService.add({})).rejects.toThrow(
      "Either --key or --file is required",
    );
  });

  it("deletes a gpg key with --yes", async () => {
    (api.delete as Mock).mockResolvedValue({ ok: true });
    const result = await gpgKeyService.delete(1, { yes: true });
    expect(result.success).toBe(true);
  });
});
