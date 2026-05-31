import process from "process";
import { Command } from "commander";
import { spawn } from "child_process";
import type { ChildProcess } from "child_process";

import output from "@/core/output";

type SpawnGh = (args: string[]) => ChildProcess;

const PROXY_COMMAND = "proxy";
const GLOBAL_OPTIONS_WITH_VALUE = new Set(["--theme"]);

const GH_INSTALL_HINT =
  "gh CLI is not installed. Install it from https://cli.github.com.";

const spawnGh: SpawnGh = (args) =>
  spawn("gh", args, {
    shell: false,
    stdio: "inherit",
  });

function findProxyCommandIndex(argv: string[]): number {
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === PROXY_COMMAND) {
      return i;
    }

    if (arg === "--json" || arg.startsWith("--theme=")) {
      continue;
    }

    if (GLOBAL_OPTIONS_WITH_VALUE.has(arg)) {
      i += 1;
      continue;
    }

    return -1;
  }

  return -1;
}

function handleProxyError(error: { code?: string }) {
  if (error.code === "ENOENT") {
    output.writeError(GH_INSTALL_HINT);
    process.exitCode = 1;
    return;
  }

  output.writeError(String(error));
  process.exitCode = 1;
}

const runProxy = (args: string[], spawnCommand: SpawnGh = spawnGh): void => {
  const child = spawnCommand(args);

  child.on("error", handleProxyError);
  child.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
};

type ProxyResult = { stdout: string; stderr: string; exitCode: number };

const spawnGhCapture: SpawnGh = (args) =>
  spawn("gh", args, {
    shell: false,
    stdio: "pipe",
  });

const runProxyCapture = (
  args: string[],
  spawnCommand: SpawnGh = spawnGhCapture,
): Promise<ProxyResult> => {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(args);

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    child.on("error", (error: { code?: string }) => {
      if (error.code === "ENOENT") {
        reject(new Error(GH_INSTALL_HINT));
        return;
      }

      reject(new Error(String(error)));
    });

    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 0,
        stdout: Buffer.concat(stdoutChunks).toString(),
        stderr: Buffer.concat(stderrChunks).toString(),
      });
    });
  });
};

const runProxyFromArgv = (
  argv = process.argv,
  spawnCommand: SpawnGh = spawnGh,
): boolean => {
  const commandIndex = findProxyCommandIndex(argv);

  if (commandIndex === -1) {
    return false;
  }

  runProxy(argv.slice(commandIndex + 1), spawnCommand);
  return true;
};

const register = (program: Command) => {
  program
    .command(`${PROXY_COMMAND} [args...]`)
    .description("Pass through to the gh CLI. Usage: ghg proxy <args>")
    .allowUnknownOption()
    .action((args: string[]) => runProxy(args));
};

export default { register, runProxy, runProxyCapture, runProxyFromArgv };
export { runProxy, runProxyCapture, runProxyFromArgv };
