import {
  scrollBy,
  getLayout,
  clampScroll,
  truncateEnd,
  getVisibleLines,
  formatScrollTitle,
} from "@/tui/layout";

import { describe, it, expect } from "vitest";

describe("tui layout", () => {
  it("should clamp scroll below zero", () => {
    expect(clampScroll(-10, 20, 5)).toBe(0);
  });

  it("should clamp scroll past the last visible line", () => {
    expect(clampScroll(99, 20, 5)).toBe(15);
  });

  it("should slice visible context lines", () => {
    const visible = getVisibleLines(["a", "b", "c", "d"], 1, 2);

    expect(visible.lines).toEqual(["b", "c"]);
    expect(visible.start).toBe(2);
    expect(visible.end).toBe(3);
  });

  it("should scroll by a delta within bounds", () => {
    expect(scrollBy(2, 10, 12, 4)).toBe(8);
    expect(scrollBy(2, -10, 12, 4)).toBe(0);
  });

  it("should format scroll title only when content overflows", () => {
    expect(
      formatScrollTitle("Context", getVisibleLines(["a", "b"], 0, 4)),
    ).toBe("Context");

    expect(
      formatScrollTitle("Context", getVisibleLines(["a", "b", "c", "d"], 1, 2)),
    ).toBe("Context 2-3/4");
  });

  it("should compute responsive panel sizes", () => {
    const compact = getLayout(90, 24);
    const wide = getLayout(140, 40);

    expect(compact.categoryWidth).toBeLessThan(wide.categoryWidth);
    expect(compact.commandWidth).toBeLessThan(wide.commandWidth);
    expect(wide.contextHeight).toBeGreaterThan(compact.contextHeight);
  });

  it("should truncate long text", () => {
    expect(truncateEnd("abcdef", 4)).toBe("abc…");
  });
});
