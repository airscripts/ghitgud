import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/api/client";
import rulesets from "@/api/rulesets";
import { jsonResponse } from "../helpers/response";

vi.mock("@/api/client", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe("rulesets api", () => {
  const ruleset = {
    rules: [],
    name: "Default",
    target: "branch",
    enforcement: "active",
    conditions: { ref_name: { include: ["~DEFAULT_BRANCH"], exclude: [] } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists rulesets", async () => {
    vi.mocked(client.get).mockResolvedValue(jsonResponse([{ id: 1 }]));
    const result = await rulesets.list("owner/repo");

    expect(result).toEqual([{ id: 1 }]);
    expect(client.get).toHaveBeenCalledWith("/repos/owner/repo/rulesets");
  });

  it("creates and updates rulesets", async () => {
    vi.mocked(client.post).mockResolvedValue({ status: 201 } as Response);
    vi.mocked(client.put).mockResolvedValue({ status: 200 } as Response);

    await rulesets.create("owner/repo", ruleset);
    await rulesets.update("owner/repo", 10, ruleset);

    expect(client.post).toHaveBeenCalledWith(
      "/repos/owner/repo/rulesets",
      ruleset,
    );

    expect(client.put).toHaveBeenCalledWith(
      "/repos/owner/repo/rulesets/10",
      ruleset,
    );
  });
});
