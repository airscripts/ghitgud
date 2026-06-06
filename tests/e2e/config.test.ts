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

  it("sets, gets, and unsets the repo key", async () => {
    const { stdout: setOut } = await run(
      ["config", "set", "repo", "airscripts/ghitgud", "--json"],
      { home: tempHome },
    );

    expect(JSON.parse(setOut)).toEqual({ success: true });

    const { stdout: getOut } = await run(["config", "get", "repo", "--json"], {
      home: tempHome,
    });

    expect(JSON.parse(getOut)).toMatchObject({
      success: true,
      key: "repo",
      value: "airscripts/ghitgud",
    });

    const { stdout: unsetOut } = await run(
      ["config", "unset", "repo", "--json"],
      { home: tempHome },
    );

    expect(JSON.parse(unsetOut)).toEqual({ success: true });

    const { stdout: getOut2 } = await run(["config", "get", "repo", "--json"], {
      home: tempHome,
    });

    expect(JSON.parse(getOut2)).toMatchObject({
      success: true,
      key: "repo",
      value: null,
    });
  });
});
