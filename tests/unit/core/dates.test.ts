import dates from "@/core/dates";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("dates", () => {
  describe("formatRelative", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T00:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should format past dates with 'ago' suffix", () => {
      const result = dates.formatRelative("2024-01-14T00:00:00Z");
      expect(result).toMatch(/ago$/);
    });

    it("should format future dates with 'in' prefix", () => {
      const result = dates.formatRelative("2024-01-16T00:00:00Z");
      expect(result).toMatch(/^in /);
    });

    it("should handle numeric timestamps (seconds)", () => {
      const timestamp = Math.floor(Date.now() / 1000) - 86400;
      const result = dates.formatRelative(timestamp);
      expect(result).toMatch(/ago$/);
    });

    it("should handle Date objects", () => {
      const dateObj = new Date(Date.now() - 86400000);
      const result = dates.formatRelative(dateObj);
      expect(result).toMatch(/ago$/);
    });
  });

  describe("formatDuration", () => {
    it("should format minutes for durations under 1 hour", () => {
      expect(dates.formatDuration(0.5)).toBe("30m");
      expect(dates.formatDuration(0.75)).toBe("45m");
    });

    it("should format hours for durations under 24 hours", () => {
      expect(dates.formatDuration(2)).toBe("2h");
      expect(dates.formatDuration(12)).toBe("12h");
    });

    it("should format days for durations under 30 days", () => {
      expect(dates.formatDuration(48)).toBe("2d");
      expect(dates.formatDuration(168)).toBe("7d");
    });

    it("should format months for durations under 12 months", () => {
      expect(dates.formatDuration(720)).toBe("1mo");
      expect(dates.formatDuration(1440)).toBe("2mo");
    });

    it("should format years for durations over 12 months", () => {
      expect(dates.formatDuration(8760)).toBe("1y");
      expect(dates.formatDuration(17520)).toBe("2y");
    });
  });

  describe("formatDateShort", () => {
    it("should format dates in short US format", () => {
      const result = dates.formatDateShort("2024-01-15T00:00:00Z");
      expect(result).toContain("Jan");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });

    it("should handle numeric timestamps", () => {
      const timestamp = 1705276800;
      const result = dates.formatRelative(timestamp);
      expect(typeof result).toBe("string");
    });

    it("should handle Date objects", () => {
      const dateObj = new Date("2024-06-01");
      const result = dates.formatDateShort(dateObj);
      expect(result).toContain("Jun");
    });
  });
});
