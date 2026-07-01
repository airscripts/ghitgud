import output from "@/core/output";
import prompt from "@/core/prompt";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockText = vi.fn();
const mockSelect = vi.fn();
const mockConfirm = vi.fn();
const mockIsCancel = vi.fn();
const mockMultiselect = vi.fn();

vi.mock("@clack/prompts", () => ({
  text: (...args: unknown[]) => mockText(...args),
  isCancel: (value: unknown) => mockIsCancel(value),
  select: (...args: unknown[]) => mockSelect(...args),
  confirm: (...args: unknown[]) => mockConfirm(...args),
  multiselect: (...args: unknown[]) => mockMultiselect(...args),
}));

vi.mock("@/core/output", () => ({
  default: {
    log: vi.fn(),
  },
}));

vi.mock("@/core/output-state", () => ({
  default: {
    isHumanOutput: () => true,
    isJsonOutput: () => false,
    isSilentOutput: () => false,
  },
}));

vi.mock("@/core/errors", () => ({
  GitfleetError: class extends Error {},
}));

describe("prompt", () => {
  const originalExit = process.exit;
  const originalCI = process.env.CI;

  beforeEach(() => {
    vi.clearAllMocks();
    process.exit = vi.fn() as unknown as typeof process.exit;
    delete process.env.CI;
  });

  afterEach(() => {
    process.exit = originalExit;

    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    } else {
      delete process.env.CI;
    }
  });

  describe("promptIfMissing", () => {
    it("should return value if provided", async () => {
      const result = await prompt.promptIfMissing("existing", "Enter value");
      expect(result).toBe("existing");
    });

    it("should prompt when value is undefined", async () => {
      mockText.mockResolvedValue("user input");
      const result = await prompt.promptIfMissing(undefined, "Enter value");
      expect(result).toBe("user input");
      expect(mockText).toHaveBeenCalled();
    });

    it("should pass placeholder option", async () => {
      mockText.mockResolvedValue("user input");
      await prompt.promptIfMissing(undefined, "Enter value", {
        placeholder: "placeholder",
      });

      expect(mockText).toHaveBeenCalledWith(
        expect.objectContaining({ placeholder: "placeholder" }),
      );
    });
  });

  describe("text", () => {
    it("should call clack text with message", async () => {
      mockText.mockResolvedValue("user input");
      const result = await prompt.text("Enter name");
      expect(result).toBe("user input");

      expect(mockText).toHaveBeenCalledWith({
        message: "Enter name",
        placeholder: undefined,
        initialValue: undefined,
      });
    });

    it("should pass options to text prompt", async () => {
      mockText.mockResolvedValue("user input");
      await prompt.text("Enter name", {
        placeholder: "John Doe",
        initialValue: "Default",
      });

      expect(mockText).toHaveBeenCalledWith({
        message: "Enter name",
        placeholder: "John Doe",
        initialValue: "Default",
      });
    });

    it("should handle cancellation", async () => {
      mockText.mockResolvedValue(Symbol("cancelled"));
      mockIsCancel.mockReturnValue(true);
      await prompt.text("Enter name");

      expect(process.exit).toHaveBeenCalledWith(0);
      expect(output.log).toHaveBeenCalledWith("Operation cancelled.");
    });
  });

  describe("select", () => {
    it("should call clack select with message and options", async () => {
      mockSelect.mockResolvedValue("option1");

      const options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
      ];

      const result = await prompt.select("Choose option", options);
      expect(result).toBe("option1");

      expect(mockSelect).toHaveBeenCalledWith({
        options,
        message: "Choose option",
      });
    });

    it("should handle cancellation", async () => {
      mockSelect.mockResolvedValue(Symbol("cancelled"));
      mockIsCancel.mockReturnValue(true);
      await prompt.select("Choose", []);
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe("confirm", () => {
    it("should call clack confirm with message", async () => {
      mockConfirm.mockResolvedValue(true);
      const result = await prompt.confirm("Are you sure?");
      expect(result).toBe(true);

      expect(mockConfirm).toHaveBeenCalledWith({
        initialValue: true,
        message: "Are you sure?",
      });
    });

    it("should return false on negative confirmation", async () => {
      mockConfirm.mockResolvedValue(false);
      const result = await prompt.confirm("Are you sure?");
      expect(result).toBe(false);
    });

    it("should handle cancellation", async () => {
      mockConfirm.mockResolvedValue(Symbol("cancelled"));
      mockIsCancel.mockReturnValue(true);
      await prompt.confirm("Are you sure?");
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe("multiSelect", () => {
    it("should call clack multiselect with message and options", async () => {
      mockMultiselect.mockResolvedValue(["option1"]);

      const options = [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
      ];

      const result = await prompt.multiSelect("Choose options", options);
      expect(result).toEqual(["option1"]);

      expect(mockMultiselect).toHaveBeenCalledWith({
        options,
        required: false,
        message: "Choose options",
      });
    });

    it("should return multiple selections", async () => {
      mockMultiselect.mockResolvedValue(["option1", "option2"]);
      const result = await prompt.multiSelect("Choose", []);
      expect(result).toEqual(["option1", "option2"]);
    });

    it("should handle cancellation", async () => {
      mockMultiselect.mockResolvedValue(Symbol("cancelled"));
      mockIsCancel.mockReturnValue(true);
      await prompt.multiSelect("Choose", []);
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});
