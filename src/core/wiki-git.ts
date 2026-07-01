import os from "os";
import path from "path";
import fs from "fs/promises";
import { promisify } from "util";
import { execFile } from "child_process";

import config from "@/core/config";

const execFileAsync = promisify(execFile);

function authenticatedEnvironment(): NodeJS.ProcessEnv {
  const token = config.getToken();
  const credentials = Buffer.from(`x-access-token:${token}`).toString("base64");

  return {
    ...process.env,
    GIT_CONFIG_COUNT: "1",
    GIT_TERMINAL_PROMPT: "0",
    GIT_CONFIG_KEY_0: "http.extraHeader",
    GIT_CONFIG_VALUE_0: `Authorization: Basic ${credentials}`,
  };
}

async function run(args: string[], cwd?: string): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd,
    encoding: "utf8",
    env: authenticatedEnvironment(),
  });

  return stdout;
}

async function withClone<T>(
  repo: string,
  task: (directory: string) => Promise<T>,
): Promise<T> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gitfleet-wiki-"));
  const directory = path.join(root, "wiki");

  try {
    await run(["clone", `https://github.com/${repo}.wiki.git`, directory]);
    return await task(directory);
  } finally {
    await fs.rm(root, { force: true, recursive: true });
  }
}

async function commitAndPush(
  directory: string,
  message: string,
): Promise<void> {
  await run(["add", "-A"], directory);
  await run(["commit", "-m", message], directory);
  await run(["push", "origin", "HEAD"], directory);
}

export default { commitAndPush, withClone };
