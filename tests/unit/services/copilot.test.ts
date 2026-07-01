import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock("@/core/output", () => ({
  default: {
    renderSection: vi.fn(),
    renderKeyValues: vi.fn(),
    writeResult: vi.fn(),
  },
}));

vi.mock("@/core/output-state", () => ({
  default: {
    isHumanOutput: vi.fn(() => true),
    isJsonOutput: vi.fn(() => false),
    isSilentOutput: vi.fn(() => false),
  },
}));

import copilotService from "@/services/copilot";
import { execSync } from "child_process";

describe("copilot service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("detect", () => {
    it("should detect installed copilot cli", () => {
      (execSync as ReturnType<typeof vi.fn>).mockReturnValue(
        "/usr/local/bin/github-copilot-cli\n",
      );

      const result = copilotService.detect();
      expect(result.installed).toBe(true);
      expect(result.path).toBe("/usr/local/bin/github-copilot-cli");
    });

    it("should detect missing copilot cli", () => {
      (execSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("not found");
      });

      const result = copilotService.detect();
      expect(result.installed).toBe(false);
      expect(result.path).toBeNull();
    });
  });

  describe("run", () => {
    it("should return failure when copilot is not installed", () => {
      (execSync as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("not found");
      });

      const result = copilotService.run(["suggest"]);
      expect(result.success).toBe(false);
      expect(result.output).toContain("not installed");
    });

    it("should run copilot when installed", () => {
      (execSync as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce("/usr/local/bin/github-copilot-cli\n")
        .mockReturnValueOnce("suggestion output");

      const result = copilotService.run(["suggest", "list files"]);
      expect(result.success).toBe(true);
    });

    it("should return failure when copilot run errors", () => {
      (execSync as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce("/usr/local/bin/github-copilot-cli\n")
        .mockImplementationOnce(() => {
          throw new Error("copilot error");
        });

      const result = copilotService.run(["suggest"]);
      expect(result.success).toBe(false);
      expect(result.output).toContain("error");
    });

    it("should pass empty args when none provided", () => {
      (execSync as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce("/usr/local/bin/github-copilot-cli\n")
        .mockReturnValueOnce("");

      const result = copilotService.run([]);
      expect(result.success).toBe(true);
    });
  });

  describe("COPILOT_INSTALL_URL", () => {
    it("should have a valid install URL", () => {
      expect(copilotService.COPILOT_INSTALL_URL).toContain("github.com");
    });
  });
});
