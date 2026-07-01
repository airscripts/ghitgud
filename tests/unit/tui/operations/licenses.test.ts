import { beforeEach, describe, expect, it, vi } from "vitest";

import licenseService from "@/services/licenses";
import licenseOperations from "@/tui/operations/licenses";

vi.mock("@/services/licenses", () => ({
  default: {
    list: vi.fn(),
    view: vi.fn(),
  },
}));

describe("license TUI operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists licenses", async () => {
    await licenseOperations[0].run({ values: {} });
    expect(licenseService.list).toHaveBeenCalledOnce();
  });

  it("views a license", async () => {
    await licenseOperations[1].run({ values: { key: "mit" } });
    expect(licenseService.view).toHaveBeenCalledWith("mit");
  });
});
