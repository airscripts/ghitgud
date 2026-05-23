import pc from "picocolors";
import process from "process";
import boxen, { type Options as BoxenOptions } from "boxen";

import logger from "@/core/logger";
import outputState from "@/core/output-state";

interface CommandResult {
  success: boolean;
  [key: string]: unknown;
}

interface TableOptions {
  emptyMessage?: string;
}

type BoxStyle = "info" | "success" | "error" | "warning";

type JsonValue = CommandResult | Record<string, unknown>;

const BOX_STYLES: Record<BoxStyle, BoxenOptions> = {
  info: {
    borderColor: "blue",
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: "round",
  },
  success: {
    borderColor: "green",
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: "round",
  },
  error: {
    borderColor: "red",
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: "round",
  },
  warning: {
    borderColor: "yellow",
    padding: 1,
    margin: { top: 0, bottom: 1 },
    borderStyle: "round",
  },
};

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

const renderBox = (content: string, style: BoxStyle = "info") => {
  if (outputState.isJsonOutput()) return;
  console.log(boxen(content, BOX_STYLES[style]));
};

const renderSuccessBox = (title: string, message: string) => {
  renderBox(`${pc.green(pc.bold(title))}\n\n${message}`, "success");
};

const renderErrorBox = (title: string, message: string) => {
  renderBox(`${pc.red(pc.bold(title))}\n\n${message}`, "error");
};

const renderInfoBox = (title: string, message: string) => {
  renderBox(`${pc.blue(pc.bold(title))}\n\n${message}`, "info");
};

const renderTable = (
  rows: Array<Record<string, unknown>>,
  options: TableOptions = {},
) => {
  if (outputState.isJsonOutput()) return;

  if (!rows.length) {
    if (options.emptyMessage) {
      console.log(options.emptyMessage);
    }

    return;
  }

  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  if (keys.length === 0) return;

  const widths: Record<string, number> = {};
  keys.forEach((key) => {
    const headerWidth = key.length;

    const maxDataWidth = Math.max(
      ...rows.map((row) => {
        const value = row[key];
        if (value === undefined || value === null) return 0;

        // Strip ANSI codes for width calculation.
        // eslint-disable-next-line no-control-regex
        const str = String(value).replace(/\x1B\[\d+m/g, "");

        return str.length;
      }),
    );

    widths[key] = Math.max(headerWidth, maxDataWidth) + 2;
  });

  const lines: string[] = [];

  const topBorder =
    "┌" + keys.map((key) => "─".repeat(widths[key])).join("┬") + "┐";

  lines.push(topBorder);
  const headerRow =
    "│" + keys.map((key) => " " + key.padEnd(widths[key] - 1)).join("│") + "│";

  lines.push(pc.bold(headerRow));
  const separator =
    "├" + keys.map((key) => "─".repeat(widths[key])).join("┼") + "┤";

  lines.push(separator);
  rows.forEach((row) => {
    const rowStr =
      "│" +
      keys
        .map((key) => {
          const value = row[key];

          const str =
            value === undefined || value === null ? "" : String(value);

          // Strip ANSI codes for width calculation.
          // eslint-disable-next-line no-control-regex
          const visibleLength = str.replace(/\x1B\[\d+m/g, "").length;

          const padding = widths[key] - visibleLength - 1;
          return " " + str + " ".repeat(padding);
        })
        .join("│") +
      "│";

    lines.push(rowStr);
  });

  const bottomBorder =
    "└" + keys.map((key) => "─".repeat(widths[key])).join("┴") + "┘";

  lines.push(bottomBorder);
  console.log();
  lines.forEach((line) => console.log(line));
};

const renderSection = (title: string) => {
  if (outputState.isJsonOutput()) return;

  console.log();
  console.log(pc.cyan(pc.bold(title)));
  console.log(pc.cyan("=".repeat(Math.max(24, title.length))));
};

const log = (message: string) => {
  if (outputState.isJsonOutput()) return;
  console.log(message);
};

const renderKeyValues = (entries: Array<[string, string | number]>) => {
  if (outputState.isJsonOutput()) return;

  entries.forEach(([label, value]) => {
    const coloredLabel = pc.gray(`${label.padEnd(16)}`);
    log(`${coloredLabel} ${value}`);
  });
};

const renderSummary = (
  title: string,
  entries: Array<[string, string | number]>,
) => {
  if (outputState.isJsonOutput()) return;
  renderSection(title);
  renderKeyValues(entries);
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
      console.log(emptyMessage);
    }

    return;
  }

  items.forEach((item, index) => {
    console.log(`${index + 1}. ${item}`);
  });
};

export default {
  log,
  renderBox,
  renderList,
  writeError,
  renderTable,
  writeResult,
  renderSection,
  renderInfoBox,
  renderSummary,
  renderErrorBox,
  buildKeyValues,
  renderKeyValues,
  renderSuccessBox,
};
