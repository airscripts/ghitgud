import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn(() => Promise.resolve("owner/repo")) },
}));
vi.mock("@/services/ruleset", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
    check: vi.fn(),
    create: vi.fn(),
    edit: vi.fn(),
    remove: vi.fn(),
    validate: vi.fn(),
  },
}));
vi.mock("@/services/status", () => ({ default: { status: vi.fn() } }));
vi.mock("@/services/api", () => ({ default: { request: vi.fn() } }));
vi.mock("@/services/queue", () => ({
  default: {
    list: vi.fn(),
    status: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    history: vi.fn(),
  },
}));

import apiService from "@/services/api";
import queueService from "@/services/queue";
import statusService from "@/services/status";
import rulesetService from "@/services/ruleset";
import apiOperations from "@/tui/operations/api";
import queueOperations from "@/tui/operations/queue";
import statusOperations from "@/tui/operations/status";
import rulesetOperations from "@/tui/operations/rulesets";

describe("roadmap TUI operations", () => {
  it("runs status and API operations", async () => {
    await statusOperations[0].run({ values: { org: "acme" } });
    await apiOperations[0].run({
      values: { endpoint: "/user", fields: "a=b", paginate: false },
    });
    expect(statusService.status).toHaveBeenCalled();
    expect(apiService.request).toHaveBeenCalled();
  });

  it("runs ruleset operations", async () => {
    await rulesetOperations[0].run({ values: { org: "acme" } });
    await rulesetOperations[2].run({ values: { branch: "main" } });
    await rulesetOperations[6].run({ values: { file: "rules.yml" } });
    expect(rulesetService.list).toHaveBeenCalled();
    expect(rulesetService.check).toHaveBeenCalled();
    expect(rulesetService.validate).toHaveBeenCalled();
  });

  it("runs queue operations", async () => {
    await queueOperations[0].run({ values: {} });
    await queueOperations[2].run({ values: { pr: 1 } });
    await queueOperations[4].run({ values: { limit: 20 } });
    expect(queueService.list).toHaveBeenCalled();
    expect(queueService.add).toHaveBeenCalled();
    expect(queueService.history).toHaveBeenCalled();
  });
});
