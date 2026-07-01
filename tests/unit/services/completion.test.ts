import { describe, it, expect, vi } from "vitest";

import completionService from "@/services/completion";
import outputState from "@/core/output-state";
import { GitfleetError } from "@/core/errors";

vi.mock("@/core/output", () => ({
  default: {
    renderTable: vi.fn(),
    writeValue: vi.fn(),
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

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe("completion service", () => {
  const commands = ["auth", "labels", "notifications", "pr", "repos"];

  describe("generate", () => {
    it("should generate bash completion", () => {
      const result = completionService.generate("bash", commands);
      expect(result).toContain("_gitfleet_completions");
      expect(result).toContain("auth");
      expect(result).toContain("labels");
    });

    it("should generate zsh completion", () => {
      const result = completionService.generate("zsh", commands);
      expect(result).toContain("#compdef gitfleet");
      expect(result).toContain("_gitfleet");
    });

    it("should generate fish completion", () => {
      const result = completionService.generate("fish", commands);
      expect(result).toContain("complete -c gitfleet");
    });

    it("should generate powershell completion", () => {
      const result = completionService.generate("powershell", commands);
      expect(result).toContain("Register-ArgumentCompleter");
      expect(result).toContain("auth");
    });

    it("should throw for unsupported shell", () => {
      expect(() =>
        completionService.generate("csh" as never, commands),
      ).toThrow(GitfleetError);
    });
  });

  describe("listShells", () => {
    it("should return supported shells", () => {
      const result = completionService.listShells();
      expect(result.success).toBe(true);
      expect(result.shells).toContain("bash");
      expect(result.shells).toContain("zsh");
      expect(result.shells).toContain("fish");
      expect(result.shells).toContain("powershell");
    });
  });

  describe("getCompletion", () => {
    it("should return completion script for human output", () => {
      const result = completionService.getCompletion("bash", commands);
      expect(result.success).toBe(true);
      expect(result.shell).toBe("bash");
      expect(result.script).toContain("_gitfleet_completions");
    });

    it("should not render for JSON output", () => {
      (outputState.isHumanOutput as ReturnType<typeof vi.fn>).mockReturnValue(
        false,
      );

      const result = completionService.getCompletion("zsh", commands);
      expect(result.success).toBe(true);
      expect(result.shell).toBe("zsh");

      (outputState.isHumanOutput as ReturnType<typeof vi.fn>).mockReturnValue(
        true,
      );
    });
  });
});
