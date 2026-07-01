import { describe, it, expect } from "vitest";

import type {
  RepoVariable,
  OrgVariable,
  EnvironmentVariable,
  VariableListResponse,
} from "@/types/variables";

describe("variables types", () => {
  it("has RepoVariable type", () => {
    const v: RepoVariable = {
      name: "MY_VAR",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      value: null,
    };

    expect(v.name).toBe("MY_VAR");
    expect(v.value).toBeNull();
  });

  it("has OrgVariable type", () => {
    const v: OrgVariable = {
      name: "ORG_VAR",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      visibility: "private",
      value: "secret",
    };

    expect(v.visibility).toBe("private");
    expect(v.value).toBe("secret");
  });

  it("has EnvironmentVariable type", () => {
    const v: EnvironmentVariable = {
      name: "ENV_VAR",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      value: "value",
    };

    expect(v.value).toBe("value");
  });

  it("has VariableListResponse type", () => {
    const res: VariableListResponse<RepoVariable> = {
      totalCount: 2,
      variables: [
        { name: "A", createdAt: "", updatedAt: "", value: null },
        { name: "B", createdAt: "", updatedAt: "", value: "x" },
      ],
    };

    expect(res.variables).toHaveLength(2);
  });
});
