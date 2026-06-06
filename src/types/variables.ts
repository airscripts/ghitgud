interface RepoVariable {
  name: string;
  createdAt: string;
  updatedAt: string;
  value: string | null;
}

interface OrgVariable {
  name: string;
  createdAt: string;
  updatedAt: string;
  visibility: string;
  value: string | null;
}

interface EnvironmentVariable {
  name: string;
  createdAt: string;
  updatedAt: string;
  value: string | null;
}

interface VariableListResponse<T> {
  variables: T[];
  totalCount: number;
}

export type { OrgVariable };
export type { RepoVariable };
export type { EnvironmentVariable };
export type { VariableListResponse };
