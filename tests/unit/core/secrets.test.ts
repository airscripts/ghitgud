import sodium from "libsodium-wrappers";
import { describe, it, expect, vi } from "vitest";

import { GitfleetError } from "@/core/errors";
import { encryptSecret } from "@/core/secrets";

vi.mock("libsodium-wrappers", () => ({
  default: {
    to_base64: vi.fn(),
    from_base64: vi.fn(),
    from_string: vi.fn(),
    ready: Promise.resolve(),
    crypto_box_seal: vi.fn(),
    base64_variants: { ORIGINAL: 1 },
  },
}));

describe("encryptSecret", () => {
  it("encrypts a value successfully", async () => {
    vi.mocked(sodium.from_base64).mockReturnValue(new Uint8Array([1, 2, 3]));
    vi.mocked(sodium.from_string).mockReturnValue(new Uint8Array([4, 5, 6]));

    vi.mocked(sodium.crypto_box_seal).mockReturnValue("encrypted");
    vi.mocked(sodium.to_base64).mockReturnValue("encrypted");
    const result = await encryptSecret("secret-value", "bXlrZXk=");
    expect(result).toBe("encrypted");
  });

  it("throws GitfleetError on encryption failure", async () => {
    vi.mocked(sodium.from_base64).mockImplementation(() => {
      throw new Error("invalid base64");
    });

    await expect(encryptSecret("v", "k")).rejects.toBeInstanceOf(GitfleetError);
  });
});
