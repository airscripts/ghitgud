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
  if (!outputState.isHumanOutput()) {
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
  results: (R | undefined)[];
  errors: ({ item: string; error: string } | undefined)[];
}> => {
  const bar = createProgressBar({ name, total: items.length });
  const results: (R | undefined)[] = new Array(items.length);

  const errors: ({ item: string; error: string } | undefined)[] = new Array(
    items.length,
  );

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      results[i] = await handler(item);
    } catch (reason) {
      const error = reason instanceof Error ? reason.message : String(reason);
      errors[i] = { item: String(item), error };
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
    results,
    success: errors.every((e) => e === undefined),

    errors: errors.filter(
      (e): e is { item: string; error: string } => e !== undefined,
    ),
  };
};

export default { createProgressBar, stopProgressBars, withProgress };
