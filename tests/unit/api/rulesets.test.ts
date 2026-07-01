import { describe, it, expect, vi, beforeEach } from "vitest";

import client from "@/providers/github/client";
import rulesets from "@/api/rulesets";
import { jsonResponse } from "../helpers/response";

vi.mock("@/providers/github/client", () => ({
  default: {
    get: vi.fn(),
    getTokenRequired: vi.fn(),
    putTokenRequired: vi.fn(),
    postTokenRequired: vi.fn(),
    deleteTokenRequired: vi.fn(),
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
    vi.mocked(client.postTokenRequired).mockResolvedValue({
      status: 201,
    } as Response);
    vi.mocked(client.putTokenRequired).mockResolvedValue({
      status: 200,
    } as Response);

    await rulesets.create("owner/repo", ruleset);
    await rulesets.update("owner/repo", 10, ruleset);

    expect(client.postTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/rulesets",
      ruleset,
    );

    expect(client.putTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/rulesets/10",
      ruleset,
    );
  });

  it("supports organization targets and branch checks", async () => {
    vi.mocked(client.getTokenRequired).mockResolvedValue(
      jsonResponse([{ id: 1, name: "Org" }]),
    );
    await rulesets.listTarget({ namespace: "acme" });
    await rulesets.getTarget({ namespace: "acme" }, 1);
    await rulesets.createTarget({ namespace: "acme" }, ruleset);
    await rulesets.updateTarget({ namespace: "acme" }, 1, ruleset);
    await rulesets.deleteTarget({ namespace: "acme" }, 1);
    await rulesets.checkBranch("owner/repo", "release/v1");
    expect(client.getTokenRequired).toHaveBeenCalledWith(
      "/repos/owner/repo/rules/branches/release%2Fv1",
    );
  });
});
