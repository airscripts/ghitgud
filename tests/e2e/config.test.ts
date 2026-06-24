import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { run, createTempDir, cleanupTempDir } from "./setup";

describe("e2e > config", () => {
  let tempHome: string;

  beforeEach(() => {
    tempHome = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempHome);
  });

  it("sets, gets, and unsets the token key", async () => {
    const { stdout: setOut } = await run(
      ["config", "set", "token", "ghp_test123", "--json"],
      { home: tempHome },
    );

    expect(JSON.parse(setOut)).toEqual({ success: true });

    const { stdout: getOut } = await run(["config", "get", "token", "--json"], {
      home: tempHome,
    });

    expect(JSON.parse(getOut)).toMatchObject({
      success: true,
      key: "token",
      value: "ghp_test123",
    });

    const { stdout: unsetOut } = await run(
      ["config", "unset", "token", "--json"],
      { home: tempHome },
    );

    expect(JSON.parse(unsetOut)).toEqual({ success: true });

    const { stdout: getOut2 } = await run(
      ["config", "get", "token", "--json"],
      { home: tempHome },
    );

    expect(JSON.parse(getOut2)).toMatchObject({
      success: true,
      key: "token",
      value: null,
    });
  });
});
