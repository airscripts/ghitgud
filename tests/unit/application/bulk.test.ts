import { describe, expect, it, vi } from "vitest";

import { runBulk } from "@/application/bulk";

describe("runBulk", () => {
  it("preserves input order and isolates failures", async () => {
    const worker = vi.fn(async (item: string) => {
      if (item === "b") throw new Error("failed b");
    });

    await expect(runBulk(["a", "b", "c"], worker, 2)).resolves.toEqual([
      { index: 0, item: "a", success: true },
      { index: 1, item: "b", success: false, error: "failed b" },
      { index: 2, item: "c", success: true },
    ]);
  });
});
