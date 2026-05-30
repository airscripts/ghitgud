import ora from "ora";

import outputState from "@/core/output-state";

interface Spinner {
  stop: () => Spinner;
  start: () => Spinner;
  fail: (text?: string) => void;
  succeed: (text?: string) => void;
}

const noopSpinner: Spinner = {
  fail: () => {},
  succeed: () => {},
  stop: () => noopSpinner,
  start: () => noopSpinner,
};

const createSpinner = (text: string): Spinner => {
  if (!outputState.isHumanOutput()) {
    return noopSpinner;
  }

  return ora({
    text,
    color: "cyan",
    spinner: "dots",
  }) as unknown as Spinner;
};

const withSpinner = async <T>(
  text: string,
  fn: () => Promise<T>,
  successText?: string,
): Promise<T> => {
  if (!outputState.isHumanOutput()) {
    return await fn();
  }

  const spinner = createSpinner(text).start();

  try {
    const result = await fn();
    spinner.succeed(successText || text);
    return result;
  } catch (error) {
    spinner.fail(`Failed: ${text}`);
    throw error;
  }
};

export default { createSpinner, withSpinner };
