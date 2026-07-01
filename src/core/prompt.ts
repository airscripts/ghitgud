import { text, select, confirm, isCancel, multiselect } from "@clack/prompts";

import output from "./output";
import { GitfleetError } from "./errors";
import outputState from "./output-state";

const isNonInteractive = (): boolean => {
  return !outputState.isHumanOutput() || !!process.env.CI;
};

const handleCancel = <T>(result: T | symbol): T => {
  if (isCancel(result)) {
    if (isNonInteractive()) {
      throw new GitfleetError("Operation cancelled (non-interactive mode).");
    }

    output.log("");
    output.log("Operation cancelled.");
    process.exit(0);
  }

  return result as T;
};

const guardNonInteractive = (message: string): void => {
  if (isNonInteractive()) {
    throw new GitfleetError(message);
  }
};

const promptIfMissing = async (
  value: string | undefined,
  message: string,
  options: { placeholder?: string } = {},
): Promise<string> => {
  if (value) return value;
  guardNonInteractive(`Required option not provided: ${message}`);

  return promptText(message, {
    placeholder: options.placeholder,
  });
};

const promptText = async (
  message: string,
  options?: { placeholder?: string; initialValue?: string },
): Promise<string> => {
  const result = await text({
    message,
    placeholder: options?.placeholder,
    initialValue: options?.initialValue,
  });

  return handleCancel(result);
};

const promptSelect = async <T extends string>(
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any[],
): Promise<T> => {
  const result = await select({
    message,
    options,
  });

  return handleCancel(result as T);
};

const promptConfirm = async (message: string): Promise<boolean> => {
  const result = await confirm({
    message,
    initialValue: true,
  });

  return handleCancel(result);
};

const promptMultiSelect = async <T extends string>(
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any[],
): Promise<T[]> => {
  const result = await multiselect({
    message,
    options,
    required: false,
  });

  return handleCancel(result as T[]);
};

export default {
  promptIfMissing,
  text: promptText,
  isNonInteractive,
  guardNonInteractive,
  select: promptSelect,
  confirm: promptConfirm,
  multiSelect: promptMultiSelect,
};
