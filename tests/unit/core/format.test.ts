import format from "@/core/format";
import { describe, it, expect, vi } from "vitest";

describe("format", () => {
  it("should format output as JSON to stdout", () => {
    const spy = vi.spyOn(console, "log");
    format.formatOutput({ success: true });
    expect(spy).toHaveBeenCalledWith(JSON.stringify({ success: true }, null, 2));
    spy.mockRestore();
  });

  it("should format error as JSON to stderr", () => {
    const spy = vi.spyOn(console, "error");
    format.formatError("Something went wrong");

    expect(spy).toHaveBeenCalledWith(
      JSON.stringify({ success: false, error: "Something went wrong" }, null, 2)
    );

    spy.mockRestore();
  });
});