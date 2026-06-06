import sodium from "libsodium-wrappers";

import { SecretEncryptionError } from "./errors";
import { ERROR_SECRET_ENCRYPTION_FAILED } from "./constants";

export async function encryptSecret(
  value: string,
  publicKeyBase64: string,
): Promise<string> {
  await sodium.ready;

  try {
    const publicKey = sodium.from_base64(
      publicKeyBase64,
      sodium.base64_variants.ORIGINAL,
    );

    const message = sodium.from_string(value);
    const encrypted = sodium.crypto_box_seal(message, publicKey);
    return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);
  } catch {
    throw new SecretEncryptionError(ERROR_SECRET_ENCRYPTION_FAILED);
  }
}
