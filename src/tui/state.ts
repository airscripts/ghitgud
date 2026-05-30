import type { TuiInput, TuiInputValues, TuiOperation } from "./types";

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
) => {
  const lines = [
    operation.title,
    operation.command,
    operation.description,
    "",
    "Inputs",
  ];

  const inputs = operation.inputs ?? [];
  if (inputs.length) {
    inputs.forEach((input, index) => {
      const value =
        maskValue(input, values[input.key]) || input.placeholder || "-";

      lines.push(
        `${index === activeField ? ">" : " "} ${input.label}: ${value}${
          input.required ? " *" : ""
        }`,
      );
    });
  } else {
    lines.push("No inputs.");
  }

  lines.push("");

  if (confirming) {
    lines.push("Mutation confirmation");
    lines.push("This action mutates state. Press y to run or n to cancel.");
    lines.push("");
  }

  lines.push("Result");
  lines.push(...result.split("\n"));

  return lines;
};

export {
  asString,
  validate,
  maskValue,
  printable,
  initialValues,
  stringifyResult,
  buildContextLines,
};
