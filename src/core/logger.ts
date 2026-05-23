import { createConsola } from "consola";

import outputState from "@/core/output-state";

const baseLogger = createConsola({ defaults: { tag: "ghitgud" } });

const callIfHuman =
  (method: (message: unknown, ...args: unknown[]) => unknown) =>
  (message: unknown, ...args: unknown[]) => {
    if (!outputState.isJsonOutput()) {
      method(message, ...args);
    }
  };

const logger = {
  success: callIfHuman(baseLogger.success.bind(baseLogger)),
  error: callIfHuman(baseLogger.error.bind(baseLogger)),
  info: callIfHuman(baseLogger.info.bind(baseLogger)),
  warn: callIfHuman(baseLogger.warn.bind(baseLogger)),
  debug: callIfHuman(baseLogger.debug.bind(baseLogger)),
};

export default logger;
