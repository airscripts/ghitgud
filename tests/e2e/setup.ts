import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);

const BINARY = path.resolve(__dirname, "../../dist/index.js");

function ensureBinary(): void {
  if (!fs.existsSync(BINARY)) {
    throw new Error(
      `Built binary not found at ${BINARY}. Run "pnpm build" first.`,
    );
  }
}

export function createTempDir(prefix = "ghg-e2e-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanupTempDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures.
  }
}

export async function run(
  args: string[],
  options: { home?: string; cwd?: string } = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  ensureBinary();
  const home = options.home ?? os.homedir();

  const { stdout, stderr } = await execFileAsync(
    "node",
    [BINARY, ...args],

    {
      cwd: options.cwd,

      env: {
        ...process.env,
        HOME: home,
        USERPROFILE: home,
      },

      timeout: 20_000,
    },
  );

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
}
