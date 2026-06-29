import path from "path";
import { execFile } from "child_process";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { createTempDir, cleanupTempDir } from "./setup";

const BINARY = path.resolve(__dirname, "../../dist/index.js");

describe("e2e > config", () => {
  let tempHome: string;

  beforeEach(() => {
    tempHome = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempHome);
  });

  it("rejects unsupported config keys", async () => {
    const result = await new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number;
    }>((resolve) => {
      execFile(
        "node",
        [BINARY, "config", "set", "token", "value", "--json"],

        {
          env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
          timeout: 20_000,
        },

        (error, stdout, stderr) => {
          resolve({
            stdout: (stdout ?? "").trim(),
            stderr: (stderr ?? "").trim(),
            exitCode: error ? (error.code as number) : 0,
          });
        },
      );
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("unsupported key");
  });
});
