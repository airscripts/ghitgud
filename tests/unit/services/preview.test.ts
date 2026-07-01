import { describe, it, expect, vi } from "vitest";

vi.mock("@/core/output", () => ({
  default: {
    renderSection: vi.fn(),
    renderKeyValues: vi.fn(),
    writeResult: vi.fn(),
  },
}));

vi.mock("@/core/logger", () => ({
  default: {
    start: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/core/output-state", () => ({
  default: {
    isHumanOutput: vi.fn(() => true),
    isJsonOutput: vi.fn(() => false),
    isSilentOutput: vi.fn(() => false),
  },
}));

vi.mock("@/core/prompt", () => ({
  default: {
    text: vi.fn(() => Promise.resolve("sample text")),
    select: vi.fn(() => Promise.resolve("b")),
    confirm: vi.fn(() => Promise.resolve(true)),
    multiSelect: vi.fn(() => Promise.resolve(["a", "c"])),
    isNonInteractive: vi.fn(() => false),
  },
}));

import previewService from "@/services/preview";

describe("preview service", () => {
  describe("PROMPT_TYPES", () => {
    it("should list all supported prompt types", () => {
      expect(previewService.PROMPT_TYPES).toContain("text");
      expect(previewService.PROMPT_TYPES).toContain("select");
      expect(previewService.PROMPT_TYPES).toContain("confirm");
      expect(previewService.PROMPT_TYPES).toContain("multiselect");
      expect(previewService.PROMPT_TYPES).toContain("password");
    });
  });

  describe("prompter", () => {
    it("should preview a single prompt type", async () => {
      const result = await previewService.prompter("text");
      expect(result.success).toBe(true);
      expect(result.preview).toBeDefined();
    });

    it("should preview all prompt types when no type specified", async () => {
      const result = await previewService.prompter(undefined);
      expect(result.success).toBe(true);
      expect(result.preview).toBeDefined();
    });
  });
});
