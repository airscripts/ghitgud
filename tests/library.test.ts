import { describe, it, expect, vi } from "vitest";
import library from "../app/library";

describe("ping", () => {
  it("should return a pong", () => {
    const spy = vi.spyOn(console, "info");
    library.ping();
    expect(spy).toHaveBeenCalledWith("pong");
  });
});