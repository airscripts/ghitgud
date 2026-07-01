import { describe, it, expect, vi, beforeEach } from "vitest";

import gpgKeyService from "@/services/gpg-key";
import gpgKeyOperations from "@/tui/operations/identity-gpg";

vi.mock("@/services/gpg-key", () => ({
  default: { list: vi.fn(), add: vi.fn(), delete: vi.fn() },
}));

describe("tui gpg-key operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs gpg-key.list", async () => {
    await gpgKeyOperations[0].run({ values: {} });
    expect(gpgKeyService.list).toHaveBeenCalled();
  });

  it("runs gpg-key.add", async () => {
    await gpgKeyOperations[1].run({
      values: { key: "-----BEGIN PGP-----..." },
    });
    expect(gpgKeyService.add).toHaveBeenCalledWith({
      key: "-----BEGIN PGP-----...",
      file: undefined,
    });
  });

  it("runs gpg-key.delete", async () => {
    await gpgKeyOperations[2].run({ values: { id: 42 } });
    expect(gpgKeyService.delete).toHaveBeenCalledWith(42, { yes: true });
  });
});
