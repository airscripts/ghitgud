import fs from "fs";
import path from "path";
import process from "process";
import { createConsola } from "consola";

import outputState from "@/core/output-state";

const baseLogger = createConsola({ defaults: { tag: "ghg" } });

const callIfHuman =
  (method: (message: unknown, ...args: unknown[]) => unknown) =>
  (message: unknown, ...args: unknown[]) => {
    if (outputState.isHumanOutput()) {
      method(message, ...args);
    }
  };

const debugLogPath = path.join(
  process.env.TMPDIR || "/tmp",
  `ghg-debug-${process.pid}.log`,
);

const writeDebugLog = (line: string) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(debugLogPath, `[${timestamp}] ${line}\n`, "utf8");
};

const pill = (
  text: string,
  bg: (s: string) => string,
  fg: (s: string) => string,
) => {
  return bg(fg(` ${text} `));
};

const printPill = (
  label: string,
  message: string,
  bg: (s: string) => string,
  fg: (s: string) => string,
) => {
  console.error(`${pill(label, bg, fg)} ${message}`);
};

const logger = {
  start: callIfHuman(baseLogger.start.bind(baseLogger)),
  success: callIfHuman(baseLogger.success.bind(baseLogger)),
  error: callIfHuman(baseLogger.error.bind(baseLogger)),
  info: callIfHuman(baseLogger.info.bind(baseLogger)),
  warn: callIfHuman(baseLogger.warn.bind(baseLogger)),

  debug: (message: unknown) => {
    if (outputState.isDebug()) {
      writeDebugLog(String(message));
    }
  },

  debugError: (error: unknown) => {
    if (outputState.isDebug()) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      writeDebugLog(`ERROR: ${message}`);

      if (stack) {
        writeDebugLog(stack);
      }
    }
  },

  getDebugLogPath: () => debugLogPath,
  printPill,
};

export default logger;
