import { describe, it, expect } from "vitest";

import type {
  RepoSecret,
  OrgSecret,
  EnvironmentSecret,
  SecretVisibility,
  EncryptedSecretInput,
  SecretListResponse,
  PublicKeyResponse,
} from "@/types/secrets";

describe("secrets types", () => {
  it("has RepoSecret type", () => {
    const secret: RepoSecret = {
      name: "MY_SECRET",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    expect(secret.name).toBe("MY_SECRET");
  });

  it("has OrgSecret type", () => {
    const secret: OrgSecret = {
      name: "ORG_SECRET",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      visibility: "selected",
      selectedRepositoriesUrl: null,
    };

    expect(secret.visibility).toBe("selected");
    expect(secret.selectedRepositoriesUrl).toBeNull();
  });

  it("has EnvironmentSecret type", () => {
    const secret: EnvironmentSecret = {
      name: "ENV_SECRET",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    expect(secret.name).toBe("ENV_SECRET");
  });

  it("has SecretVisibility type values", () => {
    const vis: SecretVisibility[] = ["all", "private", "selected"];
    expect(vis).toHaveLength(3);
  });

  it("has EncryptedSecretInput type", () => {
    const input: EncryptedSecretInput = {
      encryptedValue: "abc123",
      keyId: "key1",
    };

    expect(input.keyId).toBe("key1");
  });

  it("has SecretListResponse type", () => {
    const res: SecretListResponse<RepoSecret> = {
      totalCount: 1,
      secrets: [{ name: "X", createdAt: "", updatedAt: "" }],
    };

    expect(res.totalCount).toBe(1);
  });

  it("has PublicKeyResponse type", () => {
    const key: PublicKeyResponse = { keyId: "1", key: "pubkey" };
    expect(key.keyId).toBe("1");
  });
});
