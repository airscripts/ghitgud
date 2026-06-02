import { describe, it, expect } from "vitest";
import { render } from "@/core/template";

describe("template", () => {
  it("should substitute simple variables", () => {
    const result = render("Hello {{NAME}}!", { NAME: "world" });
    expect(result).toBe("Hello world!");
  });

  it("should substitute multiple variables", () => {
    const result = render("{{A}} and {{B}}", { A: "foo", B: "bar" });
    expect(result).toBe("foo and bar");
  });

  it("should leave unknown variables as empty", () => {
    const result = render("Hello {{UNKNOWN}}!", { NAME: "world" });
    expect(result).toBe("Hello !");
  });

  it("should handle empty template", () => {
    const result = render("", { A: "x" });
    expect(result).toBe("");
  });

  it("should handle no variables", () => {
    const result = render("plain text", {});
    expect(result).toBe("plain text");
  });
});
