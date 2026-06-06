import { describe, it, expect, vi, beforeEach } from "vitest";

import environmentsService from "@/services/environments";
import environmentOperations from "@/tui/operations/environments";

vi.mock("@/services/environments", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    addProtectionRule: vi.fn(),
    listProtectionRules: vi.fn(),
    removeProtectionRule: vi.fn(),
  },
}));

describe("tui environment operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs environment.list", async () => {
    vi.mocked(environmentsService.list).mockResolvedValue({
      success: true,
      environments: [],
    });

    const op = environmentOperations.find((o) => o.id === "environment.list")!;
    await op.run({ values: {} });
    expect(environmentsService.list).toHaveBeenCalled();
  });

  it("runs environment.create", async () => {
    vi.mocked(environmentsService.create).mockResolvedValue({ success: true });

    const op = environmentOperations.find(
      (o) => o.id === "environment.create",
    )!;

    await op.run({ values: { name: "staging", waitTimer: 30 } });
    expect(environmentsService.create).toHaveBeenCalledWith({
      waitTimer: 30,
      name: "staging",
    });
  });

  it("runs environment.protection.list", async () => {
    vi.mocked(environmentsService.listProtectionRules).mockResolvedValue({
      rules: [],
      success: true,
    });

    const op = environmentOperations.find(
      (o) => o.id === "environment.protection.list",
    )!;

    await op.run({ values: { env: "prod" } });
    expect(environmentsService.listProtectionRules).toHaveBeenCalledWith(
      "prod",
    );
  });

  it("runs environment.protection.add", async () => {
    vi.mocked(environmentsService.addProtectionRule).mockResolvedValue({
      success: true,
    });

    const op = environmentOperations.find(
      (o) => o.id === "environment.protection.add",
    )!;

    await op.run({
      values: {
        env: "prod",
        type: "wait_timer",
        value: '{"wait_timer":30}',
      },
    });

    expect(environmentsService.addProtectionRule).toHaveBeenCalledWith({
      env: "prod",
      type: "wait_timer",
      value: { wait_timer: 30 },
    });
  });

  it("runs environment.protection.remove", async () => {
    vi.mocked(environmentsService.removeProtectionRule).mockResolvedValue({
      success: true,
    });

    const op = environmentOperations.find(
      (o) => o.id === "environment.protection.remove",
    )!;

    await op.run({ values: { env: "prod", ruleId: 1 } });
    expect(environmentsService.removeProtectionRule).toHaveBeenCalledWith({
      ruleId: 1,
      env: "prod",
    });
  });
});
