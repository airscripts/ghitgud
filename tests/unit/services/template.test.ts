import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import templateService from "@/services/template";

vi.mock("@/api/templates", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    listPrTemplates: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: { start: vi.fn(), success: vi.fn() },
}));

vi.mock("@/core/output", () => ({
  default: { renderTable: vi.fn(), renderKeyValues: vi.fn() },
}));

vi.mock("@/core/repo", () => ({
  default: { resolveRepo: vi.fn().mockResolvedValue("owner/repo") },
}));

import api from "@/api/templates";

describe("template service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists templates with no templates directory", async () => {
    (api.list as Mock).mockRejectedValue(new Error("Not found"));
    (api.listPrTemplates as Mock).mockRejectedValue(new Error("Not found"));
    const result = await templateService.list({ repo: "owner/repo" });
    expect(result.success).toBe(true);
    expect(result.templates).toHaveLength(0);
  });
});
