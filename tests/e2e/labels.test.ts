import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { run, createTempDir, cleanupTempDir } from "./setup";

describe("e2e > labels", () => {
  let tempHome: string;

  beforeEach(() => {
    tempHome = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempHome);
  });

  it("lists labels from a real public repository via the GitHub API", async () => {
    await run(["config", "set", "repo", "vim/vim"], { home: tempHome });

    const { stdout } = await run(["labels", "list", "--json"], {
      home: tempHome,
    });

    const result = JSON.parse(stdout);

    expect(result).toMatchObject({
      success: true,
    });

    expect(Array.isArray(result.metadata)).toBe(true);
    expect(result.metadata.length).toBeGreaterThan(0);

    const firstLabel = result.metadata[0];
    expect(firstLabel).toHaveProperty("name");
    expect(firstLabel).toHaveProperty("color");
  });
});
