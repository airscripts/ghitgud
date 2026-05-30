import ora from "ora";
import spinner from "@/core/spinner";
import outputState from "@/core/output-state";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("ora", () => ({
  default: vi.fn((options) => ({
    fail: vi.fn(),
    succeed: vi.fn(),
    text: options?.text || "",
    stop: vi.fn().mockReturnThis(),
    start: vi.fn().mockReturnThis(),
  })),
}));

vi.mock("@/core/output-state", () => ({
  default: {
    isJsonOutput: vi.fn(),
  },
}));

describe("spinner", () => {
  beforeEach(() => {
    vi.mocked(outputState.isJsonOutput).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createSpinner", () => {
    it("should create an ora spinner in non-JSON mode", () => {
      spinner.createSpinner("Loading...");

      expect(ora).toHaveBeenCalledWith({
        color: "cyan",
        spinner: "dots",
        text: "Loading...",
      });
    });

    it("should return noop spinner in JSON mode", () => {
      vi.mocked(outputState.isJsonOutput).mockReturnValue(true);
      const result = spinner.createSpinner("Loading...");

      expect(ora).not.toHaveBeenCalled();
      expect(result).toHaveProperty("start");
      expect(result).toHaveProperty("stop");
      expect(result).toHaveProperty("succeed");
      expect(result).toHaveProperty("fail");
    });

    it("should return a working noop spinner in JSON mode", () => {
      vi.mocked(outputState.isJsonOutput).mockReturnValue(true);
      const result = spinner.createSpinner("Loading...");

      expect(result.start()).toBe(result);
      expect(result.stop()).toBe(result);
      expect(() => result.succeed()).not.toThrow();
      expect(() => result.fail()).not.toThrow();
    });
  });

  describe("withSpinner", () => {
    it("should execute function and show success", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      const result = await spinner.withSpinner("Loading...", fn, "Done!");

      expect(fn).toHaveBeenCalled();
      expect(result).toBe("result");
    });

    it("should skip spinner in JSON mode", async () => {
      vi.mocked(outputState.isJsonOutput).mockReturnValue(true);
      const fn = vi.fn().mockResolvedValue("result");
      const result = await spinner.withSpinner("Loading...", fn);

      expect(fn).toHaveBeenCalled();
      expect(result).toBe("result");
      expect(ora).not.toHaveBeenCalled();
    });

    it("should fail spinner on error and rethrow", async () => {
      const error = new Error("test error");
      const fn = vi.fn().mockRejectedValue(error);

      await expect(spinner.withSpinner("Loading...", fn)).rejects.toThrow(
        "test error",
      );
    });

    it("should use default text for success when no successText provided", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      await spinner.withSpinner("Loading...", fn);
      expect(fn).toHaveBeenCalled();
    });
  });
});
