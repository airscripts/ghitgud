import { describe, it, expect } from "vitest";

import parse from "@/core/parse";
import { GhitgudError } from "@/core/errors";

describe("parse core", () => {
  describe("parsePositiveInt", () => {
    it("parses positive integers", () => {
      expect(parse.parsePositiveInt("42", "value")).toBe(42);
      expect(parse.parsePositiveInt(" 7 ", "value")).toBe(7);
      expect(parse.parsePositiveInt(3, "value")).toBe(3);
    });

    it("rejects invalid integer values", () => {
      for (const value of ["", "0", "-1", "1.5", "12abc", "Infinity"]) {
        expect(() => parse.parsePositiveInt(value, "value")).toThrow(
          GhitgudError,
        );
      }
    });

    it("rejects unsafe integers", () => {
      expect(() => parse.parsePositiveInt("9007199254740992", "value")).toThrow(
        "Invalid value: 9007199254740992.",
      );
    });
  });
});
