interface Label {
  name: string;
  color: string;
  newName?: string;
  description: string;
}

interface RepoTargetOptions {
  org?: string;
  file?: string;
  repos?: string;
  limit?: number | string;
}

interface RepoSummary {
  id: number;
  name: string;
  fork: boolean;
  fullName: string;
  private: boolean;
  archived: boolean;
  defaultBranch: string;
  pushedAt: string | null;
}

interface RepoInspectResult {
  score: number;
  present: string[];
  missing: string[];
}

interface BulkRepoResult<T = unknown> {
  repo: string;
  metadata?: T;
  error?: string;
  success: boolean;
}

interface BulkRepoMetadata<T = unknown> {
  failed: number;
  completed: number;
  results: BulkRepoResult<T>[];
}

interface RulesetInput {
  name: string;
  target?: string;
  rules?: unknown[];
  enforcement?: string;
  conditions?: unknown;
}

interface Profile {
  repo?: string;
  token?: string;
}

interface CredentialsFile {
  repo?: string;
  token?: string;
  activeProfile?: string;
  profiles?: Record<string, Profile>;
}

interface ProfileRcFile {
  profile?: string;
}

const normalizeLabel = (label: Label) => ({
  name: label.name,
  color: label.color,
  description: label.description,
});

export type { Label };
export type { Profile };
export type { CredentialsFile };
export type { ProfileRcFile };
export type { RepoTargetOptions };
export type { RepoSummary };
export type { RepoInspectResult };
export type { BulkRepoResult };
export type { BulkRepoMetadata };
export type { RulesetInput };
export { normalizeLabel };
