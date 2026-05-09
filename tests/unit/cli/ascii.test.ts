import ascii from "@/cli/ascii";
import { describe, it, expect } from "vitest";

describe("ascii", () => {
  it("should contain the figlet-rendered title", () => {
    expect(ascii).toContain("____");
    expect(ascii).toContain("|___");
  });

  it("should be a non-empty string", () => {
    expect(typeof ascii).toBe("string");
    expect(ascii.length).toBeGreaterThan(0);
  });
});