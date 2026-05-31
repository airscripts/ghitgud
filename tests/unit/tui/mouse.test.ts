import { describe, expect, it } from "vitest";

import { SCROLL_SENSITIVITY, parseMouseEvent } from "@/tui/mouse";

describe("tui mouse", () => {
  it("should parse SGR scroll up events", () => {
    expect(parseMouseEvent("\x1b[<64;12;8M")).toEqual({
      x: 12,
      y: 8,
      type: "scroll",
      direction: "up",
    });
  });

  it("should parse SGR scroll down events", () => {
    expect(parseMouseEvent("\x1b[<65;12;8M")).toEqual({
      x: 12,
      y: 8,
      type: "scroll",
      direction: "down",
    });
  });

  it("should expose the scroll sensitivity", () => {
    expect(SCROLL_SENSITIVITY).toBe(3);
  });
});
