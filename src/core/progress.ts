import pc from "picocolors";
import { MultiBar, SingleBar } from "cli-progress";

import outputState from "@/core/output-state";

let multiBar: MultiBar | null = null;

const getMultiBar = () => {
  if (!multiBar) {
    multiBar = new MultiBar({
      hideCursor: true,
      stopOnComplete: true,
      clearOnComplete: false,
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      format: `{name} |${pc.cyan("{bar}")}| {percentage}% | {value}/{total}`,
    });
  }

  return multiBar;
};

interface ProgressBarOptions {
  name: string;
  total: number;
}

const createProgressBar = (options: ProgressBarOptions): SingleBar | null => {
  if (outputState.isJsonOutput()) {
    return null;
  }

  const bar = getMultiBar().create(options.total, 0, { name: options.name });
  return bar;
};

const stopProgressBars = () => {
  if (multiBar) {
    multiBar.stop();
    multiBar = null;
  }
};

const withProgress = async <T, R>(
  items: T[],
  name: string,
  handler: (item: T) => Promise<R>,
): Promise<{
  success: boolean;
  results: R[];
  errors: { item: string; error: string }[];
}> => {
  const bar = createProgressBar({ name, total: items.length });
  const results: R[] = [];
  const errors: { item: string; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const result = await handler(item);
      results.push(result);
    } catch (reason) {
      const error = reason instanceof Error ? reason.message : String(reason);
      errors.push({ item: String(item), error });
    }

    if (bar) {
      bar.increment();
    }
  }

  if (bar) {
    bar.stop();
  }

  stopProgressBars();

  return {
    success: errors.length === 0,
    results,
    errors,
  };
};

export default { createProgressBar, stopProgressBars, withProgress };
