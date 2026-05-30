import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBarInstance = {
  stop: vi.fn(),
  increment: vi.fn(),
};

const mockMultiBarInstance = {
  stop: vi.fn(),
  create: vi.fn().mockReturnValue(mockBarInstance),
};

vi.mock("cli-progress", () => ({
  MultiBar: vi.fn().mockImplementation(() => mockMultiBarInstance),
}));

vi.mock("@/core/output-state", () => ({
  default: {
    isJsonOutput: vi.fn(),
  },
}));

import progress from "@/core/progress";
import outputState from "@/core/output-state";

describe("progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(outputState.isJsonOutput).mockReturnValue(false);
  });

  describe("createProgressBar", () => {
    it("should create a progress bar in non-JSON mode", () => {
      const bar = progress.createProgressBar({ name: "Test", total: 10 });
      expect(bar).not.toBeNull();
    });

    it("should return null in JSON mode", () => {
      vi.mocked(outputState.isJsonOutput).mockReturnValue(true);
      const bar = progress.createProgressBar({ name: "Test", total: 10 });
      expect(bar).toBeNull();
    });
  });

  describe("stopProgressBars", () => {
    it("should stop and clean up progress bars", () => {
      progress.createProgressBar({ name: "Test", total: 10 });
      progress.stopProgressBars();
      expect(mockMultiBarInstance.stop).toHaveBeenCalled();
    });

    it("should handle multiple calls gracefully", () => {
      progress.createProgressBar({ name: "Test", total: 10 });
      progress.stopProgressBars();
      progress.stopProgressBars();
      expect(mockMultiBarInstance.stop).toHaveBeenCalled();
    });
  });

  describe("withProgress", () => {
    it("should process items and return results", async () => {
      const items = [1, 2, 3];
      const handler = vi.fn().mockImplementation((n) => Promise.resolve(n * 2));
      const result = await progress.withProgress(items, "Test", handler);

      expect(result.success).toBe(true);
      expect(result.results).toEqual([2, 4, 6]);
      expect(result.errors).toEqual([]);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("should handle errors gracefully", async () => {
      const items = [1, 2, 3];

      const handler = vi.fn().mockImplementation((n) => {
        if (n === 2) throw new Error("Failed");
        return Promise.resolve(n * 2);
      });

      const result = await progress.withProgress(items, "Test", handler);
      expect(result.success).toBe(false);
      expect(result.results).toEqual([2, 6]);
      expect(result.errors).toHaveLength(1);

      expect(result.errors[0]).toMatchObject({
        item: "2",
        error: "Failed",
      });
    });

    it("should work without progress bar in JSON mode", async () => {
      vi.mocked(outputState.isJsonOutput).mockReturnValue(true);
      const items = [1, 2];
      const handler = vi.fn().mockResolvedValue(42);

      const result = await progress.withProgress(items, "Test", handler);
      expect(result.success).toBe(true);
      expect(result.results).toEqual([42, 42]);
    });

    it("should handle empty item list", async () => {
      const result = await progress.withProgress([], "Test", vi.fn());
      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("should handle non-Error exceptions", async () => {
      const items = [1];

      const handler = vi.fn().mockImplementation(() => {
        throw "string error";
      });

      const result = await progress.withProgress(items, "Test", handler);
      expect(result.success).toBe(false);
      expect(result.errors[0].error).toBe("string error");
    });
  });
});
