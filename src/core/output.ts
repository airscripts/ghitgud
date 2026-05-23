import process from "process";

import logger from "@/core/logger";
import outputState from "@/core/output-state";

interface CommandResult {
  success: boolean;
  [key: string]: unknown;
}

interface TableOptions {
  emptyMessage?: string;
}

type JsonValue = CommandResult | Record<string, unknown>;

const writeJson = (
  value: JsonValue,
  stream: NodeJS.WriteStream = process.stdout,
) => {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
};

const writeResult = (result: unknown) => {
  if (!outputState.isJsonOutput()) return;
  if (!result || typeof result !== "object") return;

  writeJson(result as CommandResult);
};

const writeError = (message: string, hint?: string) => {
  if (outputState.isJsonOutput()) {
    writeJson(
      {
        success: false,
        error: message,
        ...(hint ? { hint } : {}),
      },
      process.stderr,
    );

    return;
  }

  logger.error(message);

  if (hint) {
    logger.info(hint);
  }
};

const renderTable = (
  rows: Array<Record<string, unknown>>,
  options: TableOptions = {},
) => {
  if (outputState.isJsonOutput()) return;

  if (!rows.length) {
    if (options.emptyMessage) {
      logger.info(options.emptyMessage);
    }

    return;
  }

  console.log();
  console.table(rows);
};

const renderSection = (title: string) => {
  if (outputState.isJsonOutput()) return;

  logger.info("");
  logger.info(title);
  logger.info("=".repeat(Math.max(24, title.length)));
};

const renderKeyValues = (entries: Array<[string, string | number]>) => {
  if (outputState.isJsonOutput()) return;

  entries.forEach(([label, value]) => {
    logger.info(`${label.padEnd(16)} ${value}`);
  });
};

const buildKeyValues = (
  obj: Record<string, string | number>,
): Array<[string, string | number]> => {
  return Object.entries(obj);
};

const renderList = (items: string[], emptyMessage?: string) => {
  if (outputState.isJsonOutput()) return;

  if (!items.length) {
    if (emptyMessage) {
      logger.info(emptyMessage);
    }

    return;
  }

  items.forEach((item, index) => {
    logger.info(`${index + 1}. ${item}`);
  });
};

export default {
  renderList,
  renderTable,
  writeError,
  writeResult,
  renderSection,
  renderKeyValues,
  buildKeyValues,
};
