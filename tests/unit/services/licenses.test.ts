import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api/licenses", () => ({
  default: {
    list: vi.fn(),
    get: vi.fn(),
    repoLicense: vi.fn(),
  },
}));

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    renderSection: vi.fn(),
    renderKeyValues: vi.fn(),
    writeResult: vi.fn(),
    writeError: vi.fn(),
    writeValue: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/core/spinner", () => ({
  default: {
    withSpinner: vi.fn((_msg, fn) => fn()),
  },
}));

import licensesService from "@/services/licenses";
import api from "@/api/licenses";

describe("licenses service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should list licenses", async () => {
      (api.list as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => [
          { key: "mit", name: "MIT License", spdx_id: "MIT", url: "" },
          {
            key: "apache-2.0",
            name: "Apache License 2.0",
            spdx_id: "Apache-2.0",
            url: "",
          },
        ],
      });

      const result = await licensesService.list();
      expect(result.success).toBe(true);
      expect(result.licenses).toHaveLength(2);
    });
  });

  describe("view", () => {
    it("should view a license by key", async () => {
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          key: "mit",
          name: "MIT License",
          spdx_id: "MIT",
          url: "",
          description: "A short license",
          implementation: "",
          permissions: ["commercial-use"],
          conditions: ["include-copyright"],
          limitations: ["liability"],
          body: "MIT License text...",
        }),
      });

      const result = await licensesService.view("mit");
      expect(result.success).toBe(true);
      expect(result.license.key).toBe("mit");
    });
  });

  describe("repoList", () => {
    it("should list license for a repo", async () => {
      (api.repoLicense as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => ({
          key: "mit",
          name: "MIT License",
          spdx_id: "MIT",
          url: "",
        }),
      });

      const result = await licensesService.repoList("owner/repo");
      expect(result.success).toBe(true);
      expect(result.repo).toBe("owner/repo");
    });
  });
});
