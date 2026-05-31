import git from "@/core/git";
import config from "@/core/config";

import type {
  TuiInput,
  TuiOperation,
  DashboardData,
  TuiInputValues,
} from "./types";

const asString = (value: string | number | boolean | undefined) => {
  if (value === undefined) return "";
  return String(value);
};

const initialValues = (operation: TuiOperation): TuiInputValues => {
  const values: TuiInputValues = {};

  for (const input of operation.inputs ?? []) {
    if (input.defaultValue !== undefined) {
      values[input.key] = input.defaultValue;
    } else if (input.type === "boolean") {
      values[input.key] = false;
    } else {
      values[input.key] = "";
    }
  }

  return values;
};

const validate = (operation: TuiOperation, values: TuiInputValues) => {
  for (const input of operation.inputs ?? []) {
    if (!input.required) continue;

    const value = values[input.key];
    if (value === undefined || value === "") {
      return `${input.label} is required.`;
    }
  }

  return null;
};

const maskValue = (
  input: TuiInput,
  value: string | number | boolean | undefined,
) => {
  if (!input.secret) return asString(value);
  return value ? "********" : "";
};

const stringifyResult = (value: unknown) => {
  if (value === undefined) return "Done.";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const printable = (input: string) => {
  return input.length === 1 && input >= " " && input !== "\u007f";
};

const buildContextLines = (
  operation: TuiOperation,
  values: TuiInputValues,
  result: string,
  confirming: boolean,
  activeField: number,
  insertMode: boolean,
) => {
  const lines = [
    operation.title,
    operation.command,
    operation.description,
    " ",
  ];

  lines.push("Inputs");
  const inputs = operation.inputs ?? [];

  if (inputs.length) {
    inputs.forEach((input, index) => {
      const value =
        maskValue(input, values[input.key]) || input.placeholder || "-";

      const marker =
        index === activeField ? (insertMode ? "[insert]" : ">") : " ";

      lines.push(
        `${marker} ${input.label}: ${value}${input.required ? " *" : ""}`,
      );
    });
  } else {
    lines.push("No inputs.");
  }

  lines.push(" ");
  if (confirming) {
    lines.push("Mutation Confirmation");
    lines.push("This action mutates state. Press y/Y to run or n/N to cancel.");
    lines.push(" ");
  }

  lines.push("Result");
  lines.push(...result.split("\n"));

  return lines;
};

const safeRead = <T>(read: () => T): T | null => {
  try {
    return read();
  } catch {
    return null;
  }
};

const getBranch = () => {
  try {
    if (!git.isInsideRepo()) return null;
    return git.getCurrentBranch();
  } catch {
    return null;
  }
};

const buildDashboardData = (version: string): DashboardData => {
  const profiles = safeRead(() => config.listProfiles()) ?? [];
  const profile = profiles.find((item) => item.active)?.name ?? null;
  const token = safeRead(() => config.getTokenOptional());

  return {
    version,
    profile,
    branch: getBranch(),
    tokenSet: !!token,
    repo: safeRead(() => config.getRepoOptional()),
  };
};

export {
  asString,
  validate,
  maskValue,
  printable,
  initialValues,
  stringifyResult,
  buildContextLines,
  buildDashboardData,
};
