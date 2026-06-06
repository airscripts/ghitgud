interface RepoSecret {
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface OrgSecret {
  name: string;
  createdAt: string;
  updatedAt: string;
  visibility: string;
  selectedRepositoriesUrl: string | null;
}

interface EnvironmentSecret {
  name: string;
  createdAt: string;
  updatedAt: string;
}

type SecretVisibility = "all" | "private" | "selected";

interface EncryptedSecretInput {
  encryptedValue: string;
  keyId: string;
}

interface SecretListResponse<T> {
  totalCount: number;
  secrets: T[];
}

interface PublicKeyResponse {
  keyId: string;
  key: string;
}

export type { OrgSecret };
export type { RepoSecret };
export type { SecretVisibility };
export type { EnvironmentSecret };
export type { PublicKeyResponse };
export type { SecretListResponse };
export type { EncryptedSecretInput };
