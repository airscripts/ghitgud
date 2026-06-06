import { describe, it, expect } from "vitest";
import { run } from "./setup";

describe("e2e > ping", () => {
  it("returns pong in json mode", async () => {
    const { stdout } = await run(["ping", "--json"]);
    const result = JSON.parse(stdout);

    expect(result).toEqual({
      success: true,
      message: "pong",
    });
  });
});
