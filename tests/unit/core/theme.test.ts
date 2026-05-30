import { setTheme, getColors, initializeTheme } from "@/core/theme";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("theme", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    setTheme("auto");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("setTheme", () => {
    it("should set theme to dark", () => {
      setTheme("dark");
      const colors = getColors();
      expect(colors.border).toBe("cyan");
      expect(colors.spinner).toBe("cyan");
    });

    it("should set theme to light", () => {
      setTheme("light");
      const colors = getColors();
      expect(colors.border).toBe("blue");
      expect(colors.spinner).toBe("blue");
    });

    it("should set theme to auto", () => {
      setTheme("auto");
      const colors = getColors();
      expect(colors).toHaveProperty("error");
      expect(colors).toHaveProperty("info");
      expect(colors).toHaveProperty("success");
    });
  });

  describe("detectTerminalBackground", () => {
    it("should detect light theme from COLORFGBG", () => {
      process.env.COLORFGBG = "0;15";
      setTheme("auto");
      const colors = getColors();
      expect(colors.border).toBe("blue");
    });

    it("should detect dark theme from COLORFGBG with dark background", () => {
      process.env.COLORFGBG = "15;0";
      setTheme("auto");
      const colors = getColors();
      expect(colors.border).toBe("cyan");
    });

    it("should detect light theme from COLORTERM containing light", () => {
      delete process.env.COLORFGBG;
      process.env.COLORTERM = "truecolor-light";
      setTheme("auto");
      const colors = getColors();
      expect(colors.border).toBe("blue");
    });

    it("should detect light theme from TERM containing light", () => {
      delete process.env.COLORFGBG;
      delete process.env.COLORTERM;
      process.env.TERM = "xterm-light";

      setTheme("auto");
      const colors = getColors();
      expect(colors.border).toBe("blue");
    });

    it("should default to dark for Apple Terminal", () => {
      delete process.env.COLORFGBG;
      delete process.env.COLORTERM;
      delete process.env.TERM;

      process.env.TERM_PROGRAM = "Apple_Terminal";
      setTheme("auto");
      const colors = getColors();
      expect(colors.border).toBe("cyan");
    });

    it("should default to dark when no indicators present", () => {
      delete process.env.COLORFGBG;
      delete process.env.COLORTERM;
      delete process.env.TERM;
      delete process.env.TERM_PROGRAM;

      setTheme("auto");
      const colors = getColors();
      expect(colors.border).toBe("cyan");
    });

    it("should handle malformed COLORFGBG gracefully", () => {
      process.env.COLORFGBG = "invalid";
      setTheme("auto");
      const colors = getColors();
      expect(colors).toHaveProperty("border");
    });

    it("should handle single-part COLORFGBG", () => {
      process.env.COLORFGBG = "0";
      setTheme("auto");
      const colors = getColors();
      expect(colors).toHaveProperty("border");
    });
  });

  describe("getColors", () => {
    it("should return color functions", () => {
      setTheme("dark");
      const colors = getColors();

      expect(typeof colors.error).toBe("function");
      expect(typeof colors.info).toBe("function");
      expect(typeof colors.muted).toBe("function");
      expect(typeof colors.primary).toBe("function");
      expect(typeof colors.success).toBe("function");
      expect(typeof colors.warning).toBe("function");
    });

    it("should apply dark theme colors correctly", () => {
      setTheme("dark");
      const colors = getColors();

      expect(colors.error("test")).toContain("test");
      expect(colors.success("test")).toContain("test");
    });

    it("should apply light theme colors correctly", () => {
      setTheme("light");
      const colors = getColors();

      expect(colors.error("test")).toContain("test");
      expect(colors.success("test")).toContain("test");
    });
  });

  describe("initializeTheme", () => {
    it("should initialize theme without errors", () => {
      expect(() => initializeTheme()).not.toThrow();
    });
  });
});
